import { auth } from "@clerk/nextjs/server";
import { start } from "workflow/api";
import { isOverMemberShipLimit } from "@/db/clerk";
import { dispatchCampaignChannels } from "@/utils/clerk";
import { logCampaignWorkflow } from "@/workflows/log-campaign";
import {
  dbCreateCampaign,
  dbGetCampaigns,
  dbGetCampaignsCountAllListsThisWeek,
  dbGetCampaignsCountThisWeek,
  dbGetSentMessages,
} from "../db/campaigns";
import { dbGetCampaignRecipients } from "../db/clients";
import { dbGetMailingListsCount } from "../db/mailing_lists";
import type { Campaign, CampaignInput, SentMessage } from "../types/types";

/**
 * Fetch campaign history
 */
export async function dalGetCampaigns(
  clientId?: string,
): Promise<{ ok: true; value: Campaign[] } | { ok: false; error: string }> {
  const { orgId } = await auth.protect();
  try {
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const campaigns = await dbGetCampaigns(orgId, clientId);
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

export async function dalCreateCampaign(
  input: CampaignInput,
): Promise<{ ok: true; value: Campaign } | { ok: false; error: string }> {
  const { orgId, has } = await auth.protect();
  try {
    const isAdmin = has({ role: "org:admin" });
    const hasSms = has({ feature: "send_sms" });

    if (!isAdmin || !orgId) {
      return {
        ok: false,
        error: "Unauthorized.",
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

    if ((input.type === "sms" || input.type === "both") && !hasSms) {
      return {
        ok: false,
        error: "SMS marketing features are not enabled for this organization.",
      };
    }

    const campaignLimit =
      [15, 10, 5].find((num) => has({ feature: `${num}_campaigns_a_week` })) ||
      1;

    const targetListName = input.mailing_list_name || undefined;

    const [
      activeListsCount,
      totalCampaignsCount,
      targetedClients,
      currentWeekCount,
      isOverMemberShipLimitValue,
    ] = await Promise.all([
      dbGetMailingListsCount(orgId),
      dbGetCampaignsCountAllListsThisWeek(orgId),
      dbGetCampaignRecipients(orgId, targetListName),
      dbGetCampaignsCountThisWeek(orgId, targetListName),
      isOverMemberShipLimit(orgId),
    ]);

    if (currentWeekCount >= campaignLimit) {
      const listLabel = targetListName
        ? `for the "${targetListName}" mailing list`
        : "for broadcast campaigns";
      return {
        ok: false,
        error: `Campaign limit reached. This organization is limited to ${campaignLimit} campaign(s) per week ${listLabel}.`,
      };
    }

    const globalLimit = activeListsCount * campaignLimit;
    if (totalCampaignsCount >= globalLimit) {
      return {
        ok: false,
        error: `Global campaign limit reached. This organization is limited to ${globalLimit} campaign(s) per week total across all lists (based on ${activeListsCount} mailing list(s) allowed).`,
      };
    }

    if (targetedClients.length === 0) {
      return {
        ok: false,
        error: `No active subscribers found in the targeted list: ${input.mailing_list_name || "Broadcast to All"}`,
      };
    }

    if (isOverMemberShipLimitValue) {
      return {
        ok: false,
        error: `Over organization membership limit.`,
      };
    }

    const emailRecipients = targetedClients.filter(
      (c) => c.opt_in_newsletter && c.email,
    );

    const smsRecipients = targetedClients.filter((c) => {
      return (
        c.opt_in_sms &&
        c.phone_number &&
        c.phone_number !== "Simulated Contact" &&
        c.phone_number !== "AWS Maintained"
      );
    });

    const dispatch = await dispatchCampaignChannels(
      input,
      emailRecipients,
      smsRecipients,
    );

    const campaign = await dbCreateCampaign(
      {
        ...input,
        mailing_list_name: input.mailing_list_name ?? "",
      },
      dispatch.successCount,
      orgId,
    );

    const finalLogs = dispatch.logs.map((log) => ({
      ...log,
      campaignId: campaign.id,
    }));

    await start(logCampaignWorkflow, [finalLogs]);

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
  const { orgId } = await auth.protect();
  try {
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
