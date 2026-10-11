import { auth } from "@clerk/nextjs/server";
import { err, ok } from "neverthrow";
import { start } from "workflow/api";
import { isOverMemberShipLimit } from "@/db/clerk";
import { dispatchCampaignChannels } from "@/utils/clerk";
import { logCampaignWorkflow } from "@/workflows/log-campaign";
import {
  dbCreateCampaign,
  dbGetCampaigns,
  dbGetCampaignsCountThisMonth,
  dbGetSentMessages,
} from "../db/campaigns";
import { dbGetCampaignRecipients } from "../db/clients";
import type {
  AppResult,
  Campaign,
  CampaignInput,
  SentMessage,
} from "../types/types";
import { getSessionPlanLimits, NO_PLAN_MESSAGE } from "./plan";

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
): Promise<AppResult<Campaign>> {
  const { orgId, has } = await auth.protect();
  try {
    const isAdmin = has({ role: "org:admin" });
    const hasSms = has({ feature: "send_sms" });

    if (!isAdmin || !orgId) {
      return err({ reason: "Unauthorized." });
    }

    if (!input.content.trim()) {
      return err({ reason: "Campaign message content cannot be empty." });
    }

    if (
      (input.type === "email" || input.type === "both") &&
      !input.subject?.trim()
    ) {
      return err({
        reason: "Email and double campaigns require a Subject line.",
      });
    }

    if ((input.type === "sms" || input.type === "both") && !hasSms) {
      return err({
        reason: "SMS marketing features are not enabled for this organization.",
      });
    }

    const targetListName = input.mailing_list_name || undefined;

    const [
      limits,
      sendsThisMonth,
      targetedClients,
      isOverMemberShipLimitValue,
    ] = await Promise.all([
      getSessionPlanLimits(),
      dbGetCampaignsCountThisMonth(orgId),
      dbGetCampaignRecipients(orgId, targetListName),
      isOverMemberShipLimit(orgId),
    ]);

    if (!limits.hasAccess) {
      return err({ reason: NO_PLAN_MESSAGE });
    }

    if (sendsThisMonth >= limits.sendsPerMonth) {
      return err({
        reason: `Monthly send limit reached. Your plan allows ${limits.sendsPerMonth} mailing list send(s) per month. Upgrade on the Pricing page for more.`,
      });
    }

    if (targetedClients.length === 0) {
      return err({
        reason: `No active subscribers found in the targeted list: ${input.mailing_list_name || "Broadcast to All"}`,
      });
    }

    if (isOverMemberShipLimitValue) {
      return err({ reason: "Over organization membership limit." });
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

    return ok(campaign);
  } catch (error) {
    console.error("dalCreateCampaign exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to dispatch marketing campaign.";
    return err({ reason: message });
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
