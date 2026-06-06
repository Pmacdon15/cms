"use server";

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
  return await dalCreateCampaign(input);
}

/**
 * Server action to retrieve delivery details for a campaign
 */
export async function actionGetSentMessages(campaignId: string) {
  return await dalGetSentMessages(campaignId);
}
