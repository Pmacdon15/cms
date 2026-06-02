import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { PinpointClient, UpdateEndpointCommand, SendMessagesCommand } from "@aws-sdk/client-pinpoint";
import type { Client } from "../types/types";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sesSender = process.env.AWS_SES_SENDER_EMAIL || "no-reply@patmac.ca";
const pinpointAppId = process.env.AWS_PINPOINT_APPLICATION_ID;

const isAwsConfigured = !!(region && accessKeyId && secretAccessKey);

// Initialize real AWS clients if configured, else null
const ses = isAwsConfigured
  ? new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

const pinpoint = isAwsConfigured
  ? new PinpointClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

/**
 * Syncs a client's data and opt-in settings to AWS Pinpoint Endpoints
 */
export async function syncClientToAws(client: Client): Promise<{ success: boolean; id?: string }> {
  if (!isAwsConfigured || !pinpoint || !pinpointAppId) {
    console.info(`[AWS SIMULATION] Syncing client to Pinpoint: ${client.name} (${client.email})`);
    return { success: true, id: `mock-pinpoint-endpoint-${client.id}` };
  }

  try {
    const endpointId = `client-${client.id}`;
    
    // Register or update Pinpoint Email Endpoint
    await pinpoint.send(
      new UpdateEndpointCommand({
        ApplicationId: pinpointAppId,
        EndpointId: endpointId,
        EndpointRequest: {
          Address: client.email,
          ChannelType: "EMAIL",
          OptOut: client.opt_in_newsletter ? "NONE" : "ALL",
          Attributes: {
            OptInSms: [client.opt_in_sms.toString()],
            PhoneNumber: [client.phone_number],
          },
          User: {
            UserId: client.id,
            UserAttributes: {
              Name: [client.name],
            },
          },
        },
      })
    );

    return { success: true, id: endpointId };
  } catch (error) {
    console.error("AWS Pinpoint sync error:", error);
    // Don't throw, return failure status so the DAL can report it gracefully
    return { success: false };
  }
}

/**
 * Sends a newsletter email to opted-in subscribers via AWS SES
 */
export async function sendEmailNewsletter(
  subject: string,
  content: string,
  recipients: string[]
): Promise<{ success: boolean; messageId?: string }> {
  if (recipients.length === 0) {
    return { success: true, messageId: "no-recipients" };
  }

  if (!isAwsConfigured || !ses) {
    console.info(`[AWS SIMULATION] Sending SES Email "${subject}" to: ${recipients.join(", ")}`);
    return { success: true, messageId: `mock-ses-msg-${Date.now()}` };
  }

  try {
    const command = new SendEmailCommand({
      Source: sesSender,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: content.replace(/\n/g, "<br/>") },
          Text: { Data: content },
        },
      },
    });

    const response = await ses.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("AWS SES send error:", error);
    return { success: false };
  }
}

/**
 * Sends an SMS text message to opted-in subscribers via AWS Pinpoint
 */
export async function sendPinpointSms(
  content: string,
  recipients: string[]
): Promise<{ success: boolean; messageId?: string }> {
  if (recipients.length === 0) {
    return { success: true, messageId: "no-recipients" };
  }

  if (!isAwsConfigured || !pinpoint || !pinpointAppId) {
    console.info(`[AWS SIMULATION] Sending Pinpoint SMS to ${recipients.join(", ")}: "${content}"`);
    return { success: true, messageId: `mock-pinpoint-sms-${Date.now()}` };
  }

  try {
    const addresses: Record<string, { ChannelType: "SMS" }> = {};
    for (const phone of recipients) {
      addresses[phone] = { ChannelType: "SMS" };
    }

    const command = new SendMessagesCommand({
      ApplicationId: pinpointAppId,
      MessageRequest: {
        Addresses: addresses,
        MessageConfiguration: {
          SMSMessage: {
            Body: content,
            MessageType: "TRANSACTIONAL",
          },
        },
      },
    });

    const response = await pinpoint.send(command);
    const resultId = response.MessageResult
      ? Object.values(response.MessageResult)[0]?.MessageId
      : `pinpoint-sms-${Date.now()}`;

    return { success: true, messageId: resultId };
  } catch (error) {
    console.error("AWS Pinpoint SMS send error:", error);
    return { success: false };
  }
}
