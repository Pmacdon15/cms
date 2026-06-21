"use server";

import { updateTag } from "next/cache";
import {
  dalCreateCampaign,
  dalGetCampaigns,
  dalGetSentMessages,
} from "../dal/campaigns";
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
  const result = await dalCreateCampaign(input);
  return result.match(
    (campaign) => {
      updateTag(`campaigns-${campaign.org_id}`);
      return { ok: true, value: campaign };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}

/**
 * Server action to retrieve delivery details for a campaign
 */
export async function actionGetSentMessages(campaignId: string) {
  return await dalGetSentMessages(campaignId);
}
