"use server";

import { updateTag } from "next/cache";
import {
  dalCreateCampaign,
  dalGetCampaigns,
  dalGetSentMessages,
} from "../dal/campaigns";
import { campaignInputSchema } from "../types/schemas";
import type { CampaignInput } from "../types/types";

/**
 * Server action to fetch marketing campaigns log
 */
export async function actionGetCampaigns() {
  return await dalGetCampaigns();
}

/**
 * Server action to send/create a campaign safely
 */
export async function actionCreateCampaign(input: CampaignInput) {
  const parsed = campaignInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.errors[0]?.message || "Invalid campaign input" };
  }
  const result = await dalCreateCampaign(parsed.data);
  return result.match(
    (campaign) => {
      updateTag(`campaigns-${campaign.org_id}`);
      return { ok: true as const, value: campaign };
    },
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to retrieve delivery details for a campaign
 */
export async function actionGetSentMessages(campaignId: string) {
  return await dalGetSentMessages(campaignId);
}
