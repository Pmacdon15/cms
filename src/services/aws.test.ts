import { beforeEach, describe, expect, it, vi } from "vitest";

const ses = vi.hoisted(() => {
  // Force the real (non-simulated) send path for this module.
  process.env.AWS_ACCESS_KEY_ID = "test-key";
  process.env.AWS_SIMULATION = "false";
  return { send: vi.fn() };
});

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: class {
    send = ses.send;
  },
  SendEmailCommand: class {
    input: { Destination: { ToAddresses: string[] } };
    constructor(input: { Destination: { ToAddresses: string[] } }) {
      this.input = input;
    }
  },
}));

import { sendEmailNewsletter } from "./aws";

const recipients = [
  { id: "c1", email: "a@example.com" },
  { id: "c2", email: "bad@example.com" },
  { id: "c3", email: "c@example.com" },
];

describe("sendEmailNewsletter", () => {
  beforeEach(() => {
    ses.send.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports only the recipients whose send failed", async () => {
    ses.send.mockImplementation(
      async (cmd: { input: { Destination: { ToAddresses: string[] } } }) => {
        const to = cmd.input.Destination.ToAddresses[0];
        if (to === "bad@example.com") throw new Error("MessageRejected");
        return { MessageId: `id-${to}` };
      },
    );

    const result = await sendEmailNewsletter("Subject", "Body", recipients);

    expect(ses.send).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
    expect(result.failedIds).toEqual(["c2"]);
    expect(result.messageId).toBe("id-c@example.com");
  });

  it("reports failure when every send fails", async () => {
    ses.send.mockRejectedValue(new Error("Throttling"));

    const result = await sendEmailNewsletter("Subject", "Body", recipients);

    expect(result.success).toBe(false);
    expect(result.failedIds).toEqual(["c1", "c2", "c3"]);
  });
});
