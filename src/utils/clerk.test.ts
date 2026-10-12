import { beforeEach, describe, expect, it, vi } from "vitest";

const aws = vi.hoisted(() => ({
  sendEmailNewsletter: vi.fn(),
  sendPinpointSms: vi.fn(),
}));

vi.mock("@/services/aws", () => aws);

import { dispatchCampaignChannels } from "./clerk";

const emailRecipients = [
  { id: "c1", email: "a@example.com", name: "A" },
  { id: "c2", email: "b@example.com", name: "B" },
  { id: "c3", email: "c@example.com", name: "C" },
];

describe("dispatchCampaignChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs and counts each email recipient by its own send result", async () => {
    aws.sendEmailNewsletter.mockResolvedValue({
      success: true,
      messageId: "msg-1",
      failedIds: ["c2"],
    });

    const result = await dispatchCampaignChannels(
      { type: "email", subject: "Hi", content: "Hello" },
      emailRecipients,
      [],
    );

    expect(result.successCount).toBe(2);
    expect(result.logs.map((l) => [l.clientId, l.status])).toEqual([
      ["c1", "sent"],
      ["c2", "failed"],
      ["c3", "sent"],
    ]);
    expect(aws.sendPinpointSms).not.toHaveBeenCalled();
  });

  it("marks every email recipient failed when the whole send fails", async () => {
    aws.sendEmailNewsletter.mockResolvedValue({ success: false });

    const result = await dispatchCampaignChannels(
      { type: "email", subject: "Hi", content: "Hello" },
      emailRecipients,
      [],
    );

    expect(result.successCount).toBe(0);
    expect(result.logs.every((l) => l.status === "failed")).toBe(true);
  });

  it("counts SMS recipients independently of email results", async () => {
    aws.sendEmailNewsletter.mockResolvedValue({
      success: true,
      messageId: "msg-1",
      failedIds: [],
    });
    aws.sendPinpointSms.mockResolvedValue({ success: true, messageId: "s-1" });

    const result = await dispatchCampaignChannels(
      { type: "both", subject: "Hi", content: "Hello" },
      emailRecipients,
      [{ id: "c1", phone_number: "+15555550100", name: "A" }],
    );

    expect(result.successCount).toBe(4);
    expect(result.logs).toHaveLength(4);
  });
});
