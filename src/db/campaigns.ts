import type { Campaign, SentMessage } from "../types/types";
import { sql } from "./neon";

/**
 * Fetch all campaigns, sorted newest first
 */
export async function dbGetCampaigns(
  orgId: string,
  clientId?: string,
): Promise<Campaign[]> {
  if (clientId) {
    const rows = (await sql`
      SELECT DISTINCT c.id, c.type, c.subject, c.content, c.sent_count, c.mailing_list_name, c.created_at
      FROM campaigns c
      JOIN sent_messages sm ON sm.campaign_id = c.id
      WHERE c.org_id = ${orgId} AND sm.client_id = ${clientId}
      ORDER BY c.created_at DESC
    `) as Campaign[];
    return rows;
  }
  const rows = (await sql`
    SELECT id, type, subject, content, sent_count, mailing_list_name, created_at
    FROM campaigns
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `) as Campaign[];
  return rows;
}
export async function dbCreateCampaign(
  campaign: {
    type: "email" | "sms" | "both";
    subject?: string | null;
    content: string;
    mailing_list_name: string;
  },
  sentCount: number, 
  orgId: string,    
): Promise<Campaign> {
  const subjectValue = campaign.type === "sms" ? null : campaign.subject || null;

  const rows = (await sql`
    INSERT INTO campaigns (org_id, type, subject, content, sent_count, mailing_list_name)
    VALUES (${orgId}, ${campaign.type}, ${subjectValue}, ${campaign.content}, ${sentCount}, ${campaign.mailing_list_name})
    RETURNING id, org_id, type, subject, content, sent_count, mailing_list_name, created_at
  `) as Campaign[];

  return rows[0];
}

/**
 * Insert a new campaign into the database
 */
export async function dbLogSentMessagesBulk(
  logs: Array<{
    campaignId: string;
    clientId: string;
    status: string;
    channel: "email" | "sms";
    msgId?: string | null;
  }>,
): Promise<void> {
  if (logs.length === 0) return;

  const campaignIds: string[] = [];
  const clientIds: string[] = [];
  const statuses: string[] = [];
  const channels: string[] = [];
  const awsMessageIds: Array<string | null> = [];

  logs.forEach((log) => {
    campaignIds.push(log.campaignId);
    clientIds.push(log.clientId);
    statuses.push(log.status);
    channels.push(log.channel);
    awsMessageIds.push(log.msgId || null);
  });

  await sql`
    INSERT INTO sent_messages (campaign_id, client_id, status, channel, aws_message_id)
    SELECT * FROM UNNEST(
      ${campaignIds}::uuid[], 
      ${clientIds}::uuid[], 
      ${statuses}::text[], 
      ${channels}::text[], 
      ${awsMessageIds}::text[]
    )
  `;
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
  const rows = (await sql`
    INSERT INTO sent_messages (campaign_id, client_id, channel, status, aws_message_id)
    VALUES (${campaignId}, ${clientId}, ${channel}, ${status}, ${awsMessageId || null})
    RETURNING id, campaign_id, client_id, channel, status, aws_message_id, created_at
  `) as SentMessage[];
  return rows[0];
}

/**
 * Fetch sent messages logs for a specific campaign
 */
export async function dbGetSentMessages(
  campaignId: string,
  orgId: string,
): Promise<SentMessage[]> {
  const rows = (await sql`
    SELECT sm.id, sm.campaign_id, sm.client_id, sm.channel, sm.status, sm.aws_message_id, sm.created_at,
           cl.email AS client_email, cl.name AS client_name
    FROM sent_messages sm
    JOIN campaigns c ON c.id = sm.campaign_id
    LEFT JOIN clients cl ON cl.id = sm.client_id
    WHERE sm.campaign_id = ${campaignId} AND c.org_id = ${orgId}
    ORDER BY sm.created_at ASC
  `) as SentMessage[];
  return rows;
}

/**
 * Get the count of campaigns dispatched by an organization this week (starting Monday) for a specific mailing list
 */
export async function dbGetCampaignsCountThisWeek(
  orgId: string,
  mailingListName?: string,
): Promise<number> {
  const rows = mailingListName
    ? ((await sql`
        SELECT COUNT(*)::integer as count
        FROM campaigns
        WHERE org_id = ${orgId}
          AND mailing_list_name = ${mailingListName}
          AND created_at >= date_trunc('week', now())
      `) as Array<{ count: number }>)
    : ((await sql`
        SELECT COUNT(*)::integer as count
        FROM campaigns
        WHERE org_id = ${orgId}
          AND mailing_list_name IS NULL
          AND created_at >= date_trunc('week', now())
      `) as Array<{ count: number }>);
  return rows[0]?.count || 0;
}

/**
 * Get the total count of campaigns dispatched by an organization this week (starting Monday) across all lists (including deleted/disabled lists)
 */
export async function dbGetCampaignsCountAllListsThisWeek(
  orgId: string,
): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::integer as count
    FROM campaigns
    WHERE org_id = ${orgId}
      AND created_at >= date_trunc('week', now())
  `) as Array<{ count: number }>;
  return rows[0]?.count || 0;
}
