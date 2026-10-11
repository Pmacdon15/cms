import { describe, expect, test } from "bun:test";
import {
  campaignFormSchema,
  campaignInputSchema,
  clientInputSchema,
  mailingListFormSchema,
  mailingListSubscriptionSchema,
} from "./schemas";

describe("clientInputSchema", () => {
  const valid = { name: "Jane", email: "jane@example.com", phone_number: "555-0100" };

  test("accepts a valid client", () => {
    expect(clientInputSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = clientInputSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  test("rejects an empty name", () => {
    const result = clientInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });
});

describe("campaignInputSchema", () => {
  test("requires a subject for email campaigns", () => {
    const result = campaignInputSchema.safeParse({ type: "email", content: "Hi" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["subject"]);
  });

  test("rejects a whitespace-only subject for 'both' campaigns", () => {
    const result = campaignInputSchema.safeParse({ type: "both", subject: "   ", content: "Hi" });
    expect(result.success).toBe(false);
  });

  test("does not require a subject for sms campaigns", () => {
    expect(campaignInputSchema.safeParse({ type: "sms", content: "Hi" }).success).toBe(true);
  });

  test("rejects empty content", () => {
    expect(campaignInputSchema.safeParse({ type: "sms", content: "" }).success).toBe(false);
  });
});

describe("campaignFormSchema", () => {
  test("accepts an sms campaign with an empty subject", () => {
    const result = campaignFormSchema.safeParse({
      type: "sms",
      subject: "",
      content: "Hello",
      mailing_list_name: "",
    });
    expect(result.success).toBe(true);
  });

  test("requires a subject for email campaigns", () => {
    const result = campaignFormSchema.safeParse({
      type: "email",
      subject: "",
      content: "Hello",
      mailing_list_name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("mailingListFormSchema", () => {
  test("requires a description", () => {
    expect(mailingListFormSchema.safeParse({ name: "News", description: "" }).success).toBe(false);
  });
});

describe("mailingListSubscriptionSchema", () => {
  test("accepts a valid subscription", () => {
    const result = mailingListSubscriptionSchema.safeParse({
      email: "a@b.co",
      listName: "News",
      status: "subscribed",
    });
    expect(result.success).toBe(true);
  });

  test("rejects an unknown status", () => {
    const result = mailingListSubscriptionSchema.safeParse({
      email: "a@b.co",
      listName: "News",
      status: "pending",
    });
    expect(result.success).toBe(false);
  });
});
