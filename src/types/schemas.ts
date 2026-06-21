import { z } from "zod";

// --- CLIENT SCHEMAS ---

export const clientInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(255, "Email is too long"),
  phone_number: z.string().min(1, "Phone is required").max(50, "Phone number is too long"),
});

export const clientSchema = clientInputSchema.extend({
  id: z.string().uuid(),
  opt_in_newsletter: z.boolean(),
  opt_in_sms: z.boolean(),
  org_id: z.string(),
  created_at: z.union([z.date(), z.string()]),
});

// --- CAMPAIGN SCHEMAS ---

export const campaignInputSchema = z.object({
  type: z.enum(["email", "sms", "both"]),
  subject: z.string().max(255, "Subject is too long").optional(),
  content: z.string().min(1, "Message content is required"),
  mailing_list_name: z.string().optional(),
}).refine(
  (data) => {
    // If it's an email/both campaign, subject is required
    if (data.type === "email" || data.type === "both") {
      return !!data.subject?.trim();
    }
    return true;
  },
  {
    message: "Subject is required for email campaigns",
    path: ["subject"],
  }
);

export const campaignFormSchema = z.object({
  type: z.enum(["email", "sms", "both"]),
  subject: z.string().max(255, "Subject is too long"),
  content: z.string().min(1, "Message content is required"),
  mailing_list_name: z.string(),
}).refine(
  (data) => {
    // If it's an email/both campaign, subject is required
    if (data.type === "email" || data.type === "both") {
      return !!data.subject.trim();
    }
    return true;
  },
  {
    message: "Subject is required for email campaigns",
    path: ["subject"],
  }
);

export const campaignSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["email", "sms", "both"]),
  subject: z.string().max(255).optional(),
  content: z.string().min(1),
  sent_count: z.number().int().nonnegative(),
  mailing_list_name: z.string().optional(),
  org_id: z.string(),
  created_at: z.union([z.date(), z.string()]),
});

// --- MAILING LIST SCHEMAS ---

export const mailingListSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  org_id: z.string().optional(),
  status: z.enum(["active", "disabled", "deleted"]).optional(),
  created_at: z.union([z.date(), z.string()]).optional(),
  campaignsSentThisWeek: z.number().int().nonnegative().optional(),
  campaignLimit: z.number().int().nonnegative().optional(),
});

export const mailingListFormSchema = z.object({
  name: z.string().min(1, "List name is required").max(255, "List name is too long"),
  description: z.string().min(1, "Description name is required").max(255, "List description is too long"),
});

export const mailingListSubscriptionSchema = z.object({
  email: z.email("Invalid email address"),
  listName: z.string(),
  status: z.enum(["subscribed", "unsubscribed"]),
});

// --- SENT MESSAGE SCHEMAS ---

export const sentMessageSchema = z.object({
  id: z.uuid(),
  campaign_id: z.uuid(),
  client_id: z.uuid(),
  channel: z.enum(["email", "sms"]),
  status: z.enum(["sent", "failed"]),
  aws_message_id: z.string().optional(),
  created_at: z.union([z.date(), z.string()]),
  client_name: z.string().optional(),
  client_email: z.string().optional(),
});
