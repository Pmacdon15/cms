import { Result, err, ok } from "neverthrow";
import { checkAuth } from "./auth";
import {
  dbCreateCampaign,
  dbGetCampaigns,
  dbGetSentMessages,
  dbLogSentMessage,
} from "../db/campaigns";
import { dbGetClients } from "../db/clients";
import { sendEmailNewsletter, sendPinpointSms } from "../services/aws";
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
 * Build, filter, execute and log a newsletter or SMS campaign
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

    // 1. Fetch subscribers to filter opt-ins
    const allClients = await dbGetClients();
    
    const emailRecipients = allClients.filter(c => c.opt_in_newsletter && c.email);
    const smsRecipients = allClients.filter(c => c.opt_in_sms && c.phone_number);

    let sentCount = 0;
    const sentLogs: Array<{ clientId: string; channel: "email" | "sms"; status: "sent" | "failed"; msgId?: string }> = [];

    // 2. Dispatch Email channel if required
    if (input.type === "email" || input.type === "both") {
      const emails = emailRecipients.map(r => r.email);
      const emailResult = await sendEmailNewsletter(
        input.subject || "CMS Newsletter Update",
        input.content,
        emails
      );

      for (const client of emailRecipients) {
        sentLogs.push({
          clientId: client.id,
          channel: "email",
          status: emailResult.success ? "sent" : "failed",
          msgId: emailResult.messageId,
        });
        if (emailResult.success) sentCount++;
      }
    }

    // 3. Dispatch SMS channel if required
    if (input.type === "sms" || input.type === "both") {
      const phones = smsRecipients.map(r => r.phone_number);
      const smsResult = await sendPinpointSms(input.content, phones);

      for (const client of smsRecipients) {
        sentLogs.push({
          clientId: client.id,
          channel: "sms",
          status: smsResult.success ? "sent" : "failed",
          msgId: smsResult.messageId,
        });
        if (smsResult.success) sentCount++;
      }
    }

    // 4. Create Campaign in DB
    const campaign = await dbCreateCampaign(input, sentCount);

    // 5. Write dispatch status log for each contact
    for (const log of sentLogs) {
      await dbLogSentMessage(campaign.id, log.clientId, log.channel, log.status, log.msgId);
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
