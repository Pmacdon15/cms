import type { Client, ClientInput } from "../types/types";
import { sql } from "./neon";

/**
 * Fetch all clients, sorted newest first
 */
export async function dbGetClients(): Promise<Client[]> {
  const rows = await sql`
    SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
    FROM clients 
    ORDER BY created_at DESC
  `;
  return rows as Client[];
}

/**
 * Fetch a single client by ID
 */
export async function dbGetClientById(id: string): Promise<Client | null> {
  const rows = await sql`
    SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
    FROM clients 
    WHERE id = ${id}
  `;
  if (rows.length === 0) return null;
  return rows[0] as Client;
}

/**
 * Fetch a single client by Email
 */
export async function dbGetClientByEmail(
  email: string,
): Promise<Client | null> {
  const rows = await sql`
    SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
    FROM clients 
    WHERE email = ${email}
  `;
  if (rows.length === 0) return null;
  return rows[0] as Client;
}

/**
 * Insert a new client into the database
 */
export async function dbCreateClient(input: ClientInput): Promise<Client> {
  const rows = await sql`
    INSERT INTO clients (name, email, phone_number, opt_in_newsletter, opt_in_sms)
    VALUES (${input.name}, ${input.email}, ${input.phone_number}, true, true)
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `;
  return rows[0] as Client;
}

/**
 * Update client opt-in status in the database
 */
export async function dbUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean,
): Promise<Client | null> {
  const rows = await sql`
    UPDATE clients
    SET opt_in_newsletter = ${optInNewsletter}, opt_in_sms = ${optInSms}
    WHERE id = ${id}
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `;
  if (rows.length === 0) return null;
  return rows[0] as Client;
}

/**
 * Get recipients for a campaign target mailing list or broadcast to all
 */
export async function dbGetCampaignRecipients(
  mailingListName?: string,
): Promise<Client[]> {
  if (mailingListName) {
    const rows = await sql`
      SELECT c.id, c.name, c.email, c.phone_number, c.opt_in_newsletter, c.opt_in_sms, c.created_at
      FROM clients c
      JOIN mailing_list_subscriptions mls ON mls.client_id = c.id
      WHERE mls.mailing_list_name = ${mailingListName} AND mls.status = 'subscribed'
      ORDER BY c.created_at DESC
    `;
    return rows as Client[];
  } else {
    return dbGetClients();
  }
}

/**
 * Delete a client by ID
 */
export async function dbDeleteClient(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM clients 
    WHERE id = ${id}
    RETURNING id
  `;
  return result.length > 0;
}
