import { sendEmailNewsletter, sendPinpointSms } from "@/services/aws";
import type { CampaignInput, DispatchResult } from "@/types/types";

export async function dispatchCampaignChannels(
  input: CampaignInput,
  emailRecipients: Array<{ id: string; email: string; name: string }>,
  smsRecipients: Array<{ id: string; phone_number: string; name: string }>,
): Promise<DispatchResult> {
  const runEmail = input.type === "email" || input.type === "both";
  const runSms = input.type === "sms" || input.type === "both";

  const [emailResult, smsResult] = await Promise.all([
    runEmail
      ? sendEmailNewsletter(
          input.subject || "CMS Newsletter Update",
          input.content,
          emailRecipients,
          input.mailing_list_name,
        )
      : null,
    runSms
      ? sendPinpointSms(
          input.content,
          smsRecipients.map((r) => r.phone_number),
        )
      : null,
  ]);

  const emailLogs = emailResult
    ? emailRecipients.map((client) => ({
        clientId: client.id,
        channel: "email" as const,
        status: emailResult.success ? ("sent" as const) : ("failed" as const),
        msgId: emailResult.messageId,
      }))
    : [];

  const smsLogs = smsResult
    ? smsRecipients.map((client) => ({
        clientId: client.id,
        channel: "sms" as const,
        status: smsResult.success ? ("sent" as const) : ("failed" as const),
        msgId: smsResult.messageId,
      }))
    : [];

  const successCount =
    (emailResult?.success ? emailRecipients.length : 0) +
    (smsResult?.success ? smsRecipients.length : 0);

  return {
    logs: [...emailLogs, ...smsLogs],
    successCount,
  };
}
