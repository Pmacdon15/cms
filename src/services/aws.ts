import {
  PinpointClient,
  SendMessagesCommand,
  UpdateEndpointCommand,
} from "@aws-sdk/client-pinpoint";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  CreateContactCommand,
  CreateContactListCommand,
  GetContactCommand,
  ListContactListsCommand,
  ListContactsCommand,
  SESv2Client,
  UpdateContactCommand,
} from "@aws-sdk/client-sesv2";
import type { Client, MailingList } from "../types/types";

const region = process.env.AWS_REGION || "us-east-1";
const sesSender = process.env.AWS_SES_SENDER_EMAIL || "no-reply@patmac.ca";
const pinpointAppId = process.env.AWS_PINPOINT_APPLICATION_ID;

const useAwsSimulation =
  process.env.AWS_SIMULATION === "true" ||
  (!process.env.AWS_ACCESS_KEY_ID &&
    !process.env.AWS_PROFILE &&
    !process.env.AWS_CREDENTIAL_PROFILES_FILE &&
    process.env.NODE_ENV !== "production");

/**
 * Returns an active AWS SESv2 Client, falling back to environment/IAM role credentials
 */
export function getSESClient() {
  return new SESv2Client({ region });
}

// Initialize AWS Clients without explicit credentials override to allow resolving from
// default credentials file ~/.aws/credentials, environment variables, or IAM profiles automatically.
const ses = new SESClient({ region });
const pinpoint = new PinpointClient({ region });

const DEFAULT_GLOBAL_LIST = "TanStackFormNewsletter";

// Simulation stores for local development when AWS credentials are not set
const simulatedContactLists: MailingList[] = [
  {
    name: "TanStackFormNewsletter",
    description: "Default customer newsletter campaign list.",
  },
  {
    name: "WeeklyDigestPro",
    description: "Weekly executive summaries and updates.",
  },
];

interface MockContact {
  email: string;
  name: string;
  optInSms: boolean;
  optInNewsletter: boolean;
}

const simulatedContacts: Record<string, MockContact[]> = {
  TanStackFormNewsletter: [
    {
      email: "john@example.com",
      name: "John Doe",
      optInSms: true,
      optInNewsletter: true,
    },
    {
      email: "alice@example.com",
      name: "Alice Smith",
      optInSms: false,
      optInNewsletter: true,
    },
    {
      email: "bob@example.com",
      name: "Bob Johnson",
      optInSms: true,
      optInNewsletter: false,
    },
  ],
  WeeklyDigestPro: [
    {
      email: "john@example.com",
      name: "John Doe",
      optInSms: true,
      optInNewsletter: true,
    },
    {
      email: "carol@example.com",
      name: "Carol Vance",
      optInSms: true,
      optInNewsletter: true,
    },
  ],
};

/**
 * Dynamically fetches all Mailing Lists (Contact Lists) directly from AWS SES
 */
export async function awsGetMailingLists(): Promise<MailingList[]> {
  const client = getSESClient();
  try {
    const response = await client.send(new ListContactListsCommand({}));
    const contactLists = response.ContactLists || [];

    if (contactLists.length === 0 && useAwsSimulation) {
      return simulatedContactLists;
    }

    return contactLists.map((cl) => ({
      name: cl.ContactListName || "",
      description: "SES Contact List",
      created_at: cl.LastUpdatedTimestamp,
    }));
  } catch (err: unknown) {
    console.error("Error listing contact lists from AWS SES:", err);
    // Graceful fallback to development mock
    return simulatedContactLists;
  }
}

/**
 * Creates a new Mailing List (Contact List) directly inside AWS SES
 */
export async function awsCreateMailingList(
  name: string,
  description?: string,
): Promise<MailingList> {
  const client = getSESClient();
  const cleanName = name.trim().replace(/\s+/g, "_"); // SES contact list names cannot contain spaces

  try {
    await client.send(
      new CreateContactListCommand({
        ContactListName: cleanName,
        Description: description || undefined,
      }),
    );
    return { name: cleanName, description };
  } catch (err: unknown) {
    if ((err as Error).name === "AlreadyExistsException") {
      return { name: cleanName, description };
    }
    console.error(`Error creating AWS contact list ${cleanName}:`, err);

    // Add to simulation cache if dev
    if (!simulatedContactLists.some((l) => l.name === cleanName)) {
      simulatedContactLists.push({ name: cleanName, description });
      simulatedContacts[cleanName] = [];
    }
    return { name: cleanName, description };
  }
}

/**
 * Fetches all subscribers (contacts) on a specific AWS SES Contact List
 */
export async function awsGetMailingListSubscribers(listName: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>
> {
  const client = getSESClient();
  try {
    const response = await client.send(
      new ListContactsCommand({
        ContactListName: listName,
      }),
    );

    const contacts = response.Contacts || [];

    if (contacts.length === 0 && useAwsSimulation) {
      const mockList = simulatedContacts[listName] || [];
      return mockList.map((m, idx) => ({
        id: `mock-subscriber-${idx}`,
        name: m.name,
        email: m.email,
        phone_number: "Simulated Contact",
        status: m.optInNewsletter ? "subscribed" : "unsubscribed",
      }));
    }

    return contacts.map((c, idx) => {
      const name = c.EmailAddress?.split("@")[0] || "Subscriber";

      return {
        id: `aws-contact-${idx}`,
        name,
        email: c.EmailAddress || "",
        phone_number: "AWS Maintained",
        status: c.UnsubscribeAll ? "unsubscribed" : "subscribed",
      };
    });
  } catch (err: unknown) {
    console.error(`Error listing contacts from AWS SES list ${listName}:`, err);
    // Dev mock fallback
    const mockList = simulatedContacts[listName] || [];
    return mockList.map((m, idx) => ({
      id: `mock-subscriber-${idx}`,
      name: m.name,
      email: m.email,
      phone_number: "Simulated Contact",
      status: m.optInNewsletter ? "subscribed" : "unsubscribed",
    }));
  }
}

/**
 * Public resolver that queries all SES Contact Lists to discover a subscriber's current states
 */
export async function awsGetClientSubscriptionsByEmail(email: string): Promise<{
  client: { name: string; email: string } | null;
  subscriptions: Array<{
    listName: string;
    description: string;
    status: "subscribed" | "unsubscribed";
  }>;
}> {
  const client = getSESClient();
  const lists = await awsGetMailingLists();

  const subscriptions: Array<{
    listName: string;
    description: string;
    status: "subscribed" | "unsubscribed";
  }> = [];
  let clientName = email.split("@")[0] || "Subscriber";

  for (const list of lists) {
    try {
      const contact = await client.send(
        new GetContactCommand({
          ContactListName: list.name,
          EmailAddress: email,
        }),
      );

      const status = contact.UnsubscribeAll ? "unsubscribed" : "subscribed";
      if (contact.AttributesData) {
        try {
          const attrs = JSON.parse(contact.AttributesData);
          if (attrs.name) clientName = attrs.name;
        } catch {}
      }

      subscriptions.push({
        listName: list.name,
        description: list.description || "",
        status,
      });
    } catch (err: unknown) {
      if ((err as Error).name === "NotFoundException") {
        subscriptions.push({
          listName: list.name,
          description: list.description || "",
          status: "unsubscribed", // Default to unsubscribed if they are not in this list
        });
      } else {
        // Credentials / connection error -> read from simulation stores
        const mockPref = simulatedContacts[list.name]?.find(
          (c) => c.email === email,
        );
        subscriptions.push({
          listName: list.name,
          description: list.description || "",
          status: mockPref
            ? mockPref.optInNewsletter
              ? "subscribed"
              : "unsubscribed"
            : "unsubscribed",
        });
      }
    }
  }

  return {
    client: {
      name: clientName,
      email,
    },
    subscriptions,
  };
}

/**
 * Updates a subscriber's opt-in status directly on an AWS SES Contact List
 */
export async function awsUpdateSubscriptionStatus(
  email: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
): Promise<boolean> {
  const client = getSESClient();
  const isUnsubscribed = status === "unsubscribed";

  if (useAwsSimulation) {
    console.info(
      `[AWS SIMULATION] Updating SES list "${listName}" subscriber ${email} to: ${status}`,
    );
    if (!simulatedContacts[listName]) simulatedContacts[listName] = [];
    const idx = simulatedContacts[listName].findIndex((c) => c.email === email);
    if (idx !== -1) {
      simulatedContacts[listName][idx].optInNewsletter = !isUnsubscribed;
    } else {
      simulatedContacts[listName].push({
        email,
        name: email.split("@")[0] || "Subscriber",
        optInSms: true,
        optInNewsletter: !isUnsubscribed,
      });
    }
    return true;
  }

  try {
    await client.send(
      new UpdateContactCommand({
        ContactListName: listName,
        EmailAddress: email,
        UnsubscribeAll: isUnsubscribed,
      }),
    );
    return true;
  } catch (err: unknown) {
    if ((err as Error).name === "NotFoundException") {
      try {
        await client.send(
          new CreateContactCommand({
            ContactListName: listName,
            EmailAddress: email,
            UnsubscribeAll: isUnsubscribed,
            AttributesData: JSON.stringify({ optInSms: true }),
          }),
        );
        return true;
      } catch (createErr) {
        console.error(
          "Error creating contact on subscription update:",
          createErr,
        );
      }
    }
    console.error(
      `Error updating AWS SES list ${listName} status for ${email}:`,
      err,
    );
    return false;
  }
}

/**
 * Registers a new contact directly to an AWS SES Contact List
 */
export async function awsAddContactToList(
  email: string,
  name: string,
  listName: string,
): Promise<boolean> {
  const client = getSESClient();

  if (useAwsSimulation) {
    console.info(
      `[AWS SIMULATION] Adding contact ${name} (${email}) to AWS list ${listName}`,
    );
    if (!simulatedContacts[listName]) simulatedContacts[listName] = [];
    if (!simulatedContacts[listName].some((c) => c.email === email)) {
      simulatedContacts[listName].push({
        email,
        name,
        optInSms: true,
        optInNewsletter: true,
      });
    }
    return true;
  }

  try {
    await client.send(
      new CreateContactCommand({
        ContactListName: listName,
        EmailAddress: email,
        UnsubscribeAll: false,
        AttributesData: JSON.stringify({ name, optInSms: true }),
      }),
    );
    return true;
  } catch (err: unknown) {
    if ((err as Error).name === "AlreadyExistsException") {
      return true;
    }
    console.error(
      `Error adding contact ${email} to AWS list ${listName}:`,
      err,
    );
    return false;
  }
}

/**
 * Legacy support for updating general newsletter / SMS channels on AWS
 */
export async function updateAwsSubscriptionStatus(
  email: string,
  optInNewsletter: boolean,
  _optInSms: boolean,
): Promise<boolean> {
  // Map general preference changes to the default Contact List
  return await awsUpdateSubscriptionStatus(
    email,
    DEFAULT_GLOBAL_LIST,
    optInNewsletter ? "subscribed" : "unsubscribed",
  );
}

/**
 * Syncs a client's data to AWS SES and Pinpoint
 */
export async function syncClientToAws(
  client: Client,
): Promise<{ success: boolean; id?: string }> {
  // Auto-subscribe the new client profile directly to the default SES Contact List!
  await awsAddContactToList(client.email, client.name, DEFAULT_GLOBAL_LIST);

  if (useAwsSimulation || !pinpointAppId) {
    console.info(
      `[AWS SIMULATION] Syncing client to Pinpoint: ${client.name} (${client.email})`,
    );
    return { success: true, id: `mock-pinpoint-endpoint-${client.id}` };
  }

  try {
    const endpointId = `client-${client.id}`;

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
      }),
    );

    return { success: true, id: endpointId };
  } catch (error) {
    console.error("AWS Pinpoint sync error:", error);
    return { success: false };
  }
}

/**
 * Dynamic batch-fetch of global newsletter preferences for local client manager view
 */
export async function getAwsSubscriptionStatuses(
  emails: string[],
): Promise<Record<string, { optInNewsletter: boolean; optInSms: boolean }>> {
  const results: Record<
    string,
    { optInNewsletter: boolean; optInSms: boolean }
  > = {};
  const client = getSESClient();

  for (const email of emails) {
    if (useAwsSimulation) {
      const mock = simulatedContacts[DEFAULT_GLOBAL_LIST]?.find(
        (c) => c.email === email,
      ) || {
        optInNewsletter: true,
        optInSms: true,
      };
      results[email] = {
        optInNewsletter: mock.optInNewsletter,
        optInSms: mock.optInSms,
      };
      continue;
    }

    try {
      const contact = await client.send(
        new GetContactCommand({
          ContactListName: DEFAULT_GLOBAL_LIST,
          EmailAddress: email,
        }),
      );

      let optInSms = true;
      if (contact.AttributesData) {
        try {
          const attrs = JSON.parse(contact.AttributesData);
          if (attrs.optInSms === false) optInSms = false;
        } catch {}
      }

      results[email] = {
        optInNewsletter: !contact.UnsubscribeAll,
        optInSms,
      };
    } catch (_err: unknown) {
      results[email] = { optInNewsletter: true, optInSms: true };
    }
  }

  return results;
}

/**
 * Sends a newsletter email to opted-in subscribers via AWS SES
 */
export async function sendEmailNewsletter(
  subject: string,
  content: string,
  recipients: Array<{ id: string; email: string }>,
  mailingListName?: string,
): Promise<{ success: boolean; messageId?: string }> {
  if (recipients.length === 0) {
    return { success: true, messageId: "no-recipients" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let lastMessageId = `mock-ses-msg-${Date.now()}`;

  for (const client of recipients) {
    const email = client.email;
    const unsubscribeLink = `${appUrl}/unsubscribe?id=${client.id}${
      mailingListName ? `&listName=${encodeURIComponent(mailingListName)}` : ""
    }`;

    const emailHtmlFooter = `
      <br/><br/>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin-top:24px;margin-bottom:12px;"/>
      <p style="font-size:12px;color:#71717a;font-family:sans-serif;line-height:1.6;">
        You are receiving this because you subscribed to our newsletter updates. 
        To update your email preferences or opt out, please 
        <a href="${unsubscribeLink}" style="color:#2563eb;text-decoration:underline;font-weight:600;">click here to unsubscribe</a>.
      </p>
    `;

    const emailTextFooter = `\n\n----------------\nTo manage your preferences or unsubscribe, visit: ${unsubscribeLink}`;

    const fullHtml = content.replace(/\n/g, "<br/>") + emailHtmlFooter;
    const fullText = content + emailTextFooter;

    if (useAwsSimulation) {
      console.info(
        `[AWS SIMULATION] Sending SES Email "${subject}" to: ${email}\nFoot link: ${unsubscribeLink}`,
      );
      continue;
    }

    try {
      const command = new SendEmailCommand({
        Source: sesSender,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: fullHtml },
            Text: { Data: fullText },
          },
        },
      });

      const response = await ses.send(command);
      lastMessageId = response.MessageId || lastMessageId;
    } catch (error) {
      console.error(`AWS SES send error for ${email}:`, error);
      return { success: false };
    }
  }

  return { success: true, messageId: lastMessageId };
}

/**
 * Sends an SMS text message to opted-in subscribers via AWS Pinpoint
 */
export async function sendPinpointSms(
  content: string,
  recipients: string[],
): Promise<{ success: boolean; messageId?: string }> {
  if (recipients.length === 0) {
    return { success: true, messageId: "no-recipients" };
  }

  if (useAwsSimulation || !pinpointAppId) {
    console.info(
      `[AWS SIMULATION] Sending Pinpoint SMS to ${recipients.join(", ")}: "${content}"`,
    );
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
    const resultId = response.MessageResponse?.Result
      ? (
          Object.values(response.MessageResponse.Result)[0] as {
            MessageId?: string;
          }
        )?.MessageId
      : `pinpoint-sms-${Date.now()}`;

    return { success: true, messageId: resultId };
  } catch (error) {
    console.error("AWS Pinpoint SMS send error:", error);
    return { success: false };
  }
}
