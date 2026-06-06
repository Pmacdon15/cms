import { dbLogSentMessagesBulk } from "@/db/campaigns";

export async function logCampaignWorkflow(
  logs: Array<{
    campaignId: string;
    clientId: string;
    status: string;
    channel: "email" | "sms";
    msgId?: string | null;
  }>,
) {
  "use workflow";

  await logMessagesStep(logs);
}

async function logMessagesStep(
  logs: Array<{
    campaignId: string;
    clientId: string;
    status: string;
    channel: "email" | "sms";
    msgId?: string | null;
  }>,
) {
  "use step";
  await dbLogSentMessagesBulk(logs);
}
