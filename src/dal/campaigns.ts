import { Result, err, ok } from "neverthrow";
import { checkAuth } from "./auth";
import {
  dbCreateCampaign,
  dbGetCampaigns,
  dbGetSentMessages,
  dbLogSentMessage,
} from "../db/campaigns";
import { dbGetClientByEmail, dbCreateClient } from "../db/clients";
import { sendEmailNewsletter, sendPinpointSms, getAwsSubscriptionStatuses, awsGetMailingListSubscribers } from "../services/aws";
import type { Campaign, CampaignInput, SentMessage } from "../types/types";

/**
 * Fetch campaign history
 */
export async function dalGetCampaigns(): Promise<Result<Campaign[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const campaigns = await dbGetCampaigns();
    return ok(campaigns);
  } catch (error: any) {
    console.error("dalGetCampaigns exception:", error);
    return err(new Error(error?.message || "Failed to retrieve campaign history."));
  }
}

/**
 * Build, execute and log a newsletter or SMS campaign using AWS SES Contact Lists directly
 */
export async function dalCreateCampaign(
  input: CampaignInput
): Promise<Result<Campaign, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    if (!input.content.trim()) {
      return err(new Error("Campaign message content cannot be empty."));
    }

    if ((input.type === "email" || input.type === "both") && !input.subject?.trim()) {
      return err(new Error("Email and double campaigns require a Subject line."));
    }

    // 1. Fetch targeted client list directly from AWS SES Contact Lists (No database lookup!)
    const targetList = input.mailing_list_name || "TanStackFormNewsletter";
    const subscribers = await awsGetMailingListSubscribers(targetList);
    
    // Filter list subscribers to only those who are active (subscribed) in SES
    const targetedClients = subscribers.filter((s) => s.status === "subscribed");

    if (targetedClients.length === 0) {
      return err(new Error(`No active subscribers found in the targeted AWS SES Contact List: ${targetList}`));
    }

    // 2. Fetch targeted clients' general opt-in preferences from AWS SES in a single batch
    const emails = targetedClients.map((c) => c.email);
    const awsPreferences = await getAwsSubscriptionStatuses(emails);

    // 3. Filter recipients using active AWS SES opt-in statuses
    const emailRecipients = targetedClients.filter((c) => {
      const globalOptIn = awsPreferences[c.email]?.optInNewsletter ?? true;
      return globalOptIn && c.email;
    });

    const smsRecipients = targetedClients.filter((c) => {
      const globalSmsOptIn = awsPreferences[c.email]?.optInSms ?? true;
      // Filter out unspecified placeholder phone numbers
      return globalSmsOptIn && c.phone_number && c.phone_number !== "Simulated Contact" && c.phone_number !== "AWS Maintained";
    });

    let sentCount = 0;
    const sentLogs: Array<{ email: string; name: string; channel: "email" | "sms"; status: "sent" | "failed"; msgId?: string }> = [];

    // 4. Dispatch Email channel if required
    if (input.type === "email" || input.type === "both") {
      const emailsList = emailRecipients.map((r) => r.email);
      const emailResult = await sendEmailNewsletter(
        input.subject || "CMS Newsletter Update",
        input.content,
        emailsList,
        input.mailing_list_name
      );

      for (const client of emailRecipients) {
        sentLogs.push({
          email: client.email,
          name: client.name,
          channel: "email",
          status: emailResult.success ? "sent" : "failed",
          msgId: emailResult.messageId,
        });
        if (emailResult.success) sentCount++;
      }
    }

    // 5. Dispatch SMS channel if required
    if (input.type === "sms" || input.type === "both") {
      const phonesList = smsRecipients.map((r) => r.phone_number);
      const smsResult = await sendPinpointSms(input.content, phonesList);

      for (const client of smsRecipients) {
        sentLogs.push({
          email: client.email,
          name: client.name,
          channel: "sms",
          status: smsResult.success ? "sent" : "failed",
          msgId: smsResult.messageId,
        });
        if (smsResult.success) sentCount++;
      }
    }

    // 6. Create Campaign in DB (stores selected mailing_list_name targeted)
    const campaign = await dbCreateCampaign(input, sentCount);

    // 7. Write delivery tracking logs for each contact
    for (const log of sentLogs) {
      // Find client in local DB to resolve ID for logging, or register placeholder if absent
      let localClient = await dbGetClientByEmail(log.email);
      if (!localClient) {
        localClient = await dbCreateClient({
          name: log.name,
          email: log.email,
          phone_number: "AWS Maintained",
        });
      }
      await dbLogSentMessage(campaign.id, localClient.id, log.channel, log.status, log.msgId);
    }

    return ok(campaign);
  } catch (error: any) {
    console.error("dalCreateCampaign exception:", error);
    return err(new Error(error?.message || "Failed to dispatch marketing campaign."));
  }
}

/**
 * Fetch logs for messages sent during a campaign
 */
export async function dalGetSentMessages(
  campaignId: string
): Promise<Result<SentMessage[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const logs = await dbGetSentMessages(campaignId);
    return ok(logs);
  } catch (error: any) {
    console.error("dalGetSentMessages exception:", error);
    return err(new Error(error?.message || "Failed to retrieve campaign delivery logs."));
  }
}
