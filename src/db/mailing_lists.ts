import type { MailingList } from "../types/types";
import { sql } from "./neon";

/**
 * Fetch all mailing lists, sorted by name/created_at
 */
export async function dbGetMailingLists(): Promise<MailingList[]> {
  const rows = await sql`
    SELECT name, description, created_at
    FROM mailing_lists
    ORDER BY created_at DESC
  `;
  return rows as MailingList[];
}

/**
 * Create a new mailing list
 */
export async function dbCreateMailingList(
  name: string,
  description?: string,
): Promise<MailingList> {
  const rows = await sql`
    INSERT INTO mailing_lists (name, description)
    VALUES (${name}, ${description || null})
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING name, description, created_at
  `;
  return rows[0] as MailingList;
}

/**
 * Fetch all clients with their subscription status for a specific list
 */
export async function dbGetMailingListSubscribers(listName: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>
> {
  const rows = await sql`
    SELECT 
      c.id, 
      c.name, 
      c.email, 
      c.phone_number, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM clients c
    LEFT JOIN mailing_list_subscriptions mls ON mls.client_id = c.id AND mls.mailing_list_name = ${listName}
    ORDER BY c.created_at DESC
  `;
  return rows as Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>;
}

/**
 * Update a client's subscription status on a specific mailing list
 */
export async function dbUpdateSubscriptionStatus(
  clientId: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
): Promise<boolean> {
  await sql`
    INSERT INTO mailing_list_subscriptions (client_id, mailing_list_name, status)
    VALUES (${clientId}, ${listName}, ${status})
    ON CONFLICT (client_id, mailing_list_name)
    DO UPDATE SET status = EXCLUDED.status
  `;
  return true;
}

/**
 * Update a client's subscription status on a specific mailing list by client email
 */
export async function dbUpdateSubscriptionStatusByEmail(
  email: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
): Promise<boolean> {
  const rows = await sql`SELECT id FROM clients WHERE email = ${email}`;
  if (rows.length === 0) return false;

  await dbUpdateSubscriptionStatus(rows[0].id, listName, status);
  return true;
}

/**
 * Fetch a subscriber's list preferences using their client ID (UUID)
 */
export async function dbGetClientSubscriptionsById(id: string) {
  const clientRows = await sql`
    SELECT id, name, email, opt_in_newsletter
    FROM clients
    WHERE id = ${id}
  `;
  if (clientRows.length === 0) {
    return null;
  }
  const client = clientRows[0];

  const subRows = await sql`
    SELECT 
      ml.name as "listName", 
      ml.description, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM mailing_lists ml
    LEFT JOIN mailing_list_subscriptions mls ON mls.mailing_list_name = ml.name AND mls.client_id = ${client.id}
    ORDER BY ml.name ASC
  `;

  return {
    client: { id: client.id, name: client.name, email: client.email },
    globalOptIn: client.opt_in_newsletter,
    subscriptions: subRows as Array<{
      listName: string;
      description: string;
      status: "subscribed" | "unsubscribed";
    }>,
  };
}

/**
 * Fetch a subscriber's list preferences using their email
 */
export async function dbGetClientSubscriptionsByEmail(email: string) {
  const clientRows = await sql`
    SELECT id, name, email, opt_in_newsletter
    FROM clients
    WHERE email = ${email}
  `;
  if (clientRows.length === 0) {
    return null;
  }
  const client = clientRows[0];

  const subRows = await sql`
    SELECT 
      ml.name as "listName", 
      ml.description, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM mailing_lists ml
    LEFT JOIN mailing_list_subscriptions mls ON mls.mailing_list_name = ml.name AND mls.client_id = ${client.id}
    ORDER BY ml.name ASC
  `;

  return {
    client: { id: client.id, name: client.name, email: client.email },
    globalOptIn: client.opt_in_newsletter,
    subscriptions: subRows as Array<{
      listName: string;
      description: string;
      status: "subscribed" | "unsubscribed";
    }>,
  };
}
