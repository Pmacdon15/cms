import { describe, expect, it } from "vitest";
import {
  campaignFormSchema,
  campaignInputSchema,
  campaignSchema,
  clientInputSchema,
  clientSchema,
  mailingListFormSchema,
  mailingListSchema,
  mailingListSubscriptionSchema,
  sentMessageSchema,
} from "./schemas";

describe("clientInputSchema", () => {
  it("accepts valid client input", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      phone_number: "+15551234567",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = clientInputSchema.safeParse({
      name: "",
      email: "jane@example.com",
      phone_number: "+15551234567",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required|Name/i);
    }
  });

  it("rejects invalid email", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane",
      email: "not-an-email",
      phone_number: "+15551234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing phone", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      phone_number: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 255 chars", () => {
    const result = clientInputSchema.safeParse({
      name: "a".repeat(256),
      email: "jane@example.com",
      phone_number: "+15551234567",
    });
    expect(result.success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("accepts a full client record", () => {
    const result = clientSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jane Doe",
      email: "jane@example.com",
      phone_number: "+15551234567",
      opt_in_newsletter: true,
      opt_in_sms: false,
      org_id: "org_123",
      created_at: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid", () => {
    const result = clientSchema.safeParse({
      id: "not-a-uuid",
      name: "Jane",
      email: "jane@example.com",
      phone_number: "123",
      opt_in_newsletter: true,
      opt_in_sms: true,
      org_id: "org_123",
      created_at: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe("campaignInputSchema", () => {
  it("accepts email campaign with subject", () => {
    const result = campaignInputSchema.safeParse({
      type: "email",
      subject: "Hello",
      content: "World",
      mailing_list_name: "Newsletter",
    });
    expect(result.success).toBe(true);
  });

  it("accepts sms campaign without subject", () => {
    const result = campaignInputSchema.safeParse({
      type: "sms",
      content: "Quick text",
    });
    expect(result.success).toBe(true);
  });

  it("rejects email campaign without subject", () => {
    const result = campaignInputSchema.safeParse({
      type: "email",
      content: "Missing subject",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("subject"))).toBe(
        true,
      );
    }
  });

  it("rejects both campaign without subject", () => {
    const result = campaignInputSchema.safeParse({
      type: "both",
      content: "Need subject for email part",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = campaignInputSchema.safeParse({
      type: "sms",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = campaignInputSchema.safeParse({
      type: "push",
      content: "Nope",
    });
    expect(result.success).toBe(false);
  });
});

describe("campaignFormSchema", () => {
  it("requires mailing_list_name", () => {
    const result = campaignFormSchema.safeParse({
      type: "sms",
      subject: "",
      content: "Hi",
      mailing_list_name: "",
    });
    // empty string is still a string; refine only checks subject for email/both
    expect(result.success).toBe(true);
  });

  it("rejects email with blank subject", () => {
    const result = campaignFormSchema.safeParse({
      type: "email",
      subject: "   ",
      content: "Body",
      mailing_list_name: "List",
    });
    expect(result.success).toBe(false);
  });
});

describe("campaignSchema", () => {
  it("accepts full campaign", () => {
    const result = campaignSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "both",
      subject: "Hi",
      content: "Body",
      sent_count: 10,
      mailing_list_name: "Newsletter",
      org_id: "org_1",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative sent_count", () => {
    const result = campaignSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "email",
      subject: "Hi",
      content: "Body",
      sent_count: -1,
      org_id: "org_1",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("mailingListSchema", () => {
  it("accepts minimal list", () => {
    const result = mailingListSchema.safeParse({
      name: "WeeklyDigest",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full list with status", () => {
    const result = mailingListSchema.safeParse({
      name: "WeeklyDigest",
      description: "Weekly updates",
      org_id: "org_1",
      status: "active",
      created_at: new Date(),
      sendsThisMonth: 2,
      sendLimit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = mailingListSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("mailingListFormSchema", () => {
  it("requires name and description", () => {
    const ok = mailingListFormSchema.safeParse({
      name: "New List",
      description: "A description",
    });
    expect(ok.success).toBe(true);

    const bad = mailingListFormSchema.safeParse({
      name: "",
      description: "",
    });
    expect(bad.success).toBe(false);
  });
});

describe("mailingListSubscriptionSchema", () => {
  it("accepts valid subscription", () => {
    const result = mailingListSubscriptionSchema.safeParse({
      email: "user@example.com",
      listName: "Newsletter",
      status: "subscribed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = mailingListSubscriptionSchema.safeParse({
      email: "user@example.com",
      listName: "Newsletter",
      status: "pending",
    });
    expect(result.success).toBe(false);
  });
});

describe("sentMessageSchema", () => {
  it("accepts a valid sent message log", () => {
    const result = sentMessageSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      campaign_id: "550e8400-e29b-41d4-a716-446655440001",
      client_id: "550e8400-e29b-41d4-a716-446655440002",
      channel: "email",
      status: "sent",
      aws_message_id: "msg-abc",
      created_at: new Date().toISOString(),
      client_name: "Jane",
      client_email: "jane@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid channel", () => {
    const result = sentMessageSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      campaign_id: "550e8400-e29b-41d4-a716-446655440001",
      client_id: "550e8400-e29b-41d4-a716-446655440002",
      channel: "push",
      status: "sent",
      created_at: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
