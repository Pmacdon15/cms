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
  const result = await dalGetCampaigns();
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Server action to send/create a campaign safely
 */
export async function actionCreateCampaign(input: CampaignInput) {
  const result = await dalCreateCampaign(input);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Server action to retrieve delivery details for a campaign
 */
export async function actionGetSentMessages(campaignId: string) {
  const result = await dalGetSentMessages(campaignId);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}
