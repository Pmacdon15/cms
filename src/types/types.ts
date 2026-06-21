import type { Result } from "neverthrow";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  opt_in_newsletter: boolean; // Stored locally in PostgreSQL
  opt_in_sms: boolean; // Stored locally in PostgreSQL
  org_id: string;
  created_at: Date | string;
}

export interface Campaign {
  id: string;
  type: "email" | "sms" | "both";
  subject?: string;
  content: string;
  sent_count: number;
  mailing_list_name?: string;
  org_id: string;
  created_at: Date | string;
}

export interface SentMessage {
  id: string;
  campaign_id: string;
  client_id: string;
  channel: "email" | "sms";
  status: "sent" | "failed";
  aws_message_id?: string;
  created_at: Date | string;
  client_name?: string;
  client_email?: string;
}

export interface MailingList {
  name: string;
  description?: string;
  org_id?: string;
  status?: "active" | "disabled" | "deleted";
  created_at?: Date | string;
  campaignsSentThisWeek?: number;
  campaignLimit?: number;
}

export interface MailingListSubscription {
  email: string;
  listName: string;
  status: "subscribed" | "unsubscribed";
}

// Client create input structure (AWS handles initial subscriptions)
export interface ClientInput {
  name: string;
  email: string;
  phone_number: string;
}

// Campaign create input structure
export interface CampaignInput {
  type: "email" | "sms" | "both";
  subject?: string;
  content: string;
  mailing_list_name?: string;
}

export type AppResult<T> = Result<T, { reason: string }>;

export type DispatchResult = {
  logs: Array<{
    clientId: string;
    channel: "email" | "sms";
    status: "sent" | "failed";
    msgId?: string;
  }>;
  successCount: number;
};
