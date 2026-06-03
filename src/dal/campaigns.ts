import { auth } from "@clerk/nextjs/server";
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
export async function dalGetCampaigns(): Promise<
  { ok: true; value: Campaign[] } | { ok: false; error: string }
> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const campaigns = await dbGetCampaigns(orgId);
    return { ok: true, value: campaigns };
  } catch (error) {
    console.error("dalGetCampaigns exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve campaign history.";
    return { ok: false, error: message };
  }
}

/**
 * Build, execute and log a newsletter or SMS campaign using database target lists
 */
export async function dalCreateCampaign(
  input: CampaignInput,
): Promise<{ ok: true; value: Campaign } | { ok: false; error: string }> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId, isAdmin } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }
    if (!isAdmin) {
      return {
        ok: false,
        error: "Unauthorized. Only organization admins can dispatch campaigns.",
      };
    }

    if (!input.content.trim()) {
      return { ok: false, error: "Campaign message content cannot be empty." };
    }

    if (
      (input.type === "email" || input.type === "both") &&
      !input.subject?.trim()
    ) {
      return {
        ok: false,
        error: "Email and double campaigns require a Subject line.",
      };
    }

    // Check for send_sms feature flag via Clerk auth has()
    const hasClerkKeys = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
    );
    const clerkAuth = await auth();
    const hasSms =
      !hasClerkKeys ||
      (clerkAuth.has ? clerkAuth.has({ permission: "send_sms" }) : false);

    if ((input.type === "sms" || input.type === "both") && !hasSms) {
      return {
        ok: false,
        error: "SMS marketing features are not enabled for this organization.",
      };
    }

    // 1. Fetch targeted client list directly from local database
    const targetListName = input.mailing_list_name || undefined;
    const targetedClients = await dbGetCampaignRecipients(
      orgId,
      targetListName,
    );

    if (targetedClients.length === 0) {
      return {
        ok: false,
        error: `No active subscribers found in the targeted list: ${input.mailing_list_name || "Broadcast to All"}`,
      };
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
    const campaign = await dbCreateCampaign(input, sentCount, orgId);

    // 6. Write delivery tracking logs for each contact
    for (const log of sentLogs) {
      let localClient = await dbGetClientByEmail(log.email, orgId);
      if (!localClient) {
        localClient = await dbCreateClient(
          {
            name: log.name,
            email: log.email,
            phone_number: "AWS Maintained",
          },
          orgId,
        );
      }
      await dbLogSentMessage(
        campaign.id,
        localClient.id,
        log.channel,
        log.status,
        log.msgId,
      );
    }

    return { ok: true, value: campaign };
  } catch (error) {
    console.error("dalCreateCampaign exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to dispatch marketing campaign.";
    return { ok: false, error: message };
  }
}

/**
 * Fetch logs for messages sent during a campaign
 */
export async function dalGetSentMessages(
  campaignId: string,
): Promise<{ ok: true; value: SentMessage[] } | { ok: false; error: string }> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const logs = await dbGetSentMessages(campaignId, orgId);
    return { ok: true, value: logs };
  } catch (error) {
    console.error("dalGetSentMessages exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve campaign delivery logs.";
    return { ok: false, error: message };
  }
}
