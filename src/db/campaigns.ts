import type { Campaign, CampaignInput, SentMessage } from "../types/types";
import { sql } from "./neon";

let isCampaignsSchemaInitialized = false;

/**
 * Dynamically auto-provisions the database campaigns schema if the mailing_list_name column is missing.
 */
async function ensureCampaignsSchema() {
  if (isCampaignsSchemaInitialized) return;
  try {
    await sql`
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mailing_list_name VARCHAR(255)
    `;
    isCampaignsSchemaInitialized = true;
  } catch (err) {
    console.error(
      "Failed to dynamically auto-provision campaigns schema:",
      err,
    );
  }
}

/**
 * Fetch all campaigns, sorted newest first
 */
export async function dbGetCampaigns(): Promise<Campaign[]> {
  await ensureCampaignsSchema();
  const rows = await sql`
    SELECT id, type, subject, content, sent_count, mailing_list_name, created_at
    FROM campaigns
    ORDER BY created_at DESC
  `;
  return rows as Campaign[];
}

/**
 * Insert a new campaign into the database
 */
export async function dbCreateCampaign(
  input: CampaignInput,
  sentCount: number,
): Promise<Campaign> {
  await ensureCampaignsSchema();
  const rows = await sql`
    INSERT INTO campaigns (type, subject, content, sent_count, mailing_list_name)
    VALUES (${input.type}, ${input.subject || null}, ${input.content}, ${sentCount}, ${input.mailing_list_name || null})
    RETURNING id, type, subject, content, sent_count, mailing_list_name, created_at
  `;
  return rows[0] as Campaign;
}

/**
 * Log a sent message delivery status
 */
export async function dbLogSentMessage(
  campaignId: string,
  clientId: string,
  channel: "email" | "sms",
  status: "sent" | "failed",
  awsMessageId?: string,
): Promise<SentMessage> {
  const rows = await sql`
    INSERT INTO sent_messages (campaign_id, client_id, channel, status, aws_message_id)
    VALUES (${campaignId}, ${clientId}, ${channel}, ${status}, ${awsMessageId || null})
    RETURNING id, campaign_id, client_id, channel, status, aws_message_id, created_at
  `;
  return rows[0] as SentMessage;
}

/**
 * Fetch sent messages logs for a specific campaign
 */
export async function dbGetSentMessages(
  campaignId: string,
): Promise<SentMessage[]> {
  const rows = await sql`
    SELECT id, campaign_id, client_id, channel, status, aws_message_id, created_at
    FROM sent_messages
    WHERE campaign_id = ${campaignId}
    ORDER BY created_at ASC
  `;
  return rows as SentMessage[];
}
