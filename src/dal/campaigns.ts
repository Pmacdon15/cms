import { err, ok, type Result } from "neverthrow";
import {
  dbCreateCampaign,
  dbGetCampaigns,
  dbGetSentMessages,
  dbLogSentMessage,
} from "../db/campaigns";
import {
  dbCreateClient,
  dbGetCampaignRecipients,
  dbGetClientByEmail,
} from "../db/clients";
import { sendEmailNewsletter, sendPinpointSms } from "../services/aws";
import type { Campaign, CampaignInput, SentMessage } from "../types/types";
import { checkAuth } from "./auth";

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
    return err(
      new Error(error?.message || "Failed to retrieve campaign history."),
    );
  }
}

/**
 * Build, execute and log a newsletter or SMS campaign using database target lists
 */
export async function dalCreateCampaign(
  input: CampaignInput,
): Promise<Result<Campaign, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    if (!input.content.trim()) {
      return err(new Error("Campaign message content cannot be empty."));
    }

    if (
      (input.type === "email" || input.type === "both") &&
      !input.subject?.trim()
    ) {
      return err(
        new Error("Email and double campaigns require a Subject line."),
      );
    }

    // 1. Fetch targeted client list directly from local database
    const targetListName = input.mailing_list_name || undefined;
    const targetedClients = await dbGetCampaignRecipients(targetListName);

    if (targetedClients.length === 0) {
      return err(
        new Error(
          `No active subscribers found in the targeted list: ${
            input.mailing_list_name || "Broadcast to All"
          }`,
        ),
      );
    }

    // 2. Filter recipients using database opt-in flags (instead of AWS SES preference querying)
    const emailRecipients = targetedClients.filter((c) => {
      return c.opt_in_newsletter && c.email;
    });

    const smsRecipients = targetedClients.filter((c) => {
      return (
        c.opt_in_sms &&
        c.phone_number &&
        c.phone_number !== "Simulated Contact" &&
        c.phone_number !== "AWS Maintained"
      );
    });

    let sentCount = 0;
    const sentLogs: Array<{
      email: string;
      name: string;
      channel: "email" | "sms";
      status: "sent" | "failed";
      msgId?: string;
    }> = [];

    // 3. Dispatch Email channel if required
    if (input.type === "email" || input.type === "both") {
      const emailResult = await sendEmailNewsletter(
        input.subject || "CMS Newsletter Update",
        input.content,
        emailRecipients, // Pass objects containing client ID and email
        input.mailing_list_name,
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

    // 4. Dispatch SMS channel if required
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

    // 5. Create Campaign in DB
    const campaign = await dbCreateCampaign(input, sentCount);

    // 6. Write delivery tracking logs for each contact
    for (const log of sentLogs) {
      let localClient = await dbGetClientByEmail(log.email);
      if (!localClient) {
        localClient = await dbCreateClient({
          name: log.name,
          email: log.email,
          phone_number: "AWS Maintained",
        });
      }
      await dbLogSentMessage(
        campaign.id,
        localClient.id,
        log.channel,
        log.status,
        log.msgId,
      );
    }

    return ok(campaign);
  } catch (error: any) {
    console.error("dalCreateCampaign exception:", error);
    return err(
      new Error(error?.message || "Failed to dispatch marketing campaign."),
    );
  }
}

/**
 * Fetch logs for messages sent during a campaign
 */
export async function dalGetSentMessages(
  campaignId: string,
): Promise<Result<SentMessage[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const logs = await dbGetSentMessages(campaignId);
    return ok(logs);
  } catch (error: any) {
    console.error("dalGetSentMessages exception:", error);
    return err(
      new Error(error?.message || "Failed to retrieve campaign delivery logs."),
    );
  }
}
