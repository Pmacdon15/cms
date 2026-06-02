import type { Result } from "neverthrow";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  opt_in_newsletter: boolean;
  opt_in_sms: boolean;
  created_at: Date | string;
}

export interface Campaign {
  id: string;
  type: "email" | "sms" | "both";
  subject?: string;
  content: string;
  sent_count: number;
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
}

// Client create input structure
export interface ClientInput {
  name: string;
  email: string;
  phone_number: string;
  opt_in_newsletter: boolean;
  opt_in_sms: boolean;
}

// Campaign create input structure
export interface CampaignInput {
  type: "email" | "sms" | "both";
  subject?: string;
  content: string;
}

// Common type for Result patterns
export type AppResult<T, E = string> = Result<T, E>;
