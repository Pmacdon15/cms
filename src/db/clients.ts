import type { Client, ClientInput } from "../types/types";
import { sql } from "./neon";

/**
 * Fetch all clients, sorted newest first
 */
export async function dbGetClients(orgId: string): Promise<Client[]> {
  const rows = await sql`
    SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
    FROM clients 
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  return rows as Client[];
}

/**
 * Search clients by name, email, or phone number matching query
 */
export async function dbSearchClients(
  orgId: string,
  query: string,
): Promise<Client[]> {
  const pattern = `%${query}%`;
  const rows = await sql`
    SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
    FROM clients 
    WHERE org_id = ${orgId}
      AND (
        name ILIKE ${pattern} OR 
        email ILIKE ${pattern} OR 
        phone_number ILIKE ${pattern}
      )
    ORDER BY created_at DESC
  `;
  return rows as Client[];
}

/**
 * Fetch a single client by ID
 */
export async function dbGetClientById(
  id: string,
  orgId?: string,
): Promise<Client | null> {
  const rows = (
    orgId
      ? await sql`
        SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
        FROM clients 
        WHERE id = ${id} AND org_id = ${orgId}
      `
      : await sql`
        SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
        FROM clients 
        WHERE id = ${id}
      `
  ) as Client[];
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Fetch a single client by Email
 */
export async function dbGetClientByEmail(
  email: string,
  orgId?: string,
): Promise<Client | null> {
  const rows = (
    orgId
      ? await sql`
        SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
        FROM clients 
        WHERE email = ${email} AND org_id = ${orgId}
      `
      : await sql`
        SELECT id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at 
        FROM clients 
        WHERE email = ${email}
      `
  ) as Client[];
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Insert a new client into the database
 */
export async function dbCreateClient(
  input: ClientInput,
  orgId: string,
): Promise<Client> {
  const rows = (await sql`
    INSERT INTO clients (name, email, phone_number, opt_in_newsletter, opt_in_sms, org_id)
    VALUES (${input.name}, ${input.email}, ${input.phone_number}, true, true, ${orgId})
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `) as Client[];
  return rows[0];
}

/**
 * Update client opt-in status in the database
 */
export async function dbUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean,
  orgId?: string,
): Promise<Client | null> {
  const rows = (
    orgId
      ? await sql`
        UPDATE clients
        SET opt_in_newsletter = ${optInNewsletter}, opt_in_sms = ${optInSms}
        WHERE id = ${id} AND org_id = ${orgId}
        RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
      `
      : await sql`
        UPDATE clients
        SET opt_in_newsletter = ${optInNewsletter}, opt_in_sms = ${optInSms}
        WHERE id = ${id}
        RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
      `
  ) as Client[];
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Update client details in the database
 */
export async function dbUpdateClient(
  id: string,
  input: ClientInput,
  orgId: string,
): Promise<Client | null> {
  const rows = (await sql`
    UPDATE clients
    SET name = ${input.name}, email = ${input.email}, phone_number = ${input.phone_number}
    WHERE id = ${id} AND org_id = ${orgId}
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `) as Client[];
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Get recipients for a campaign target mailing list or broadcast to all
 */
export async function dbGetCampaignRecipients(
  orgId: string,
  mailingListName?: string,
): Promise<Client[]> {
  if (mailingListName) {
    const rows = await sql`
      SELECT c.id, c.name, c.email, c.phone_number, c.opt_in_newsletter, c.opt_in_sms, c.created_at
      FROM clients c
      JOIN mailing_list_subscriptions mls ON mls.client_id = c.id
      WHERE mls.mailing_list_name = ${mailingListName} 
        AND mls.status = 'subscribed'
        AND c.org_id = ${orgId}
        AND mls.org_id = ${orgId}
      ORDER BY c.created_at DESC
    `;
    return rows as Client[];
  }
  return dbGetClients(orgId);
}

/**
 * Delete a client by ID
 */
export async function dbDeleteClient(
  id: string,
  orgId: string,
): Promise<boolean> {
  const result = (await sql`
    DELETE FROM clients 
    WHERE id = ${id} AND org_id = ${orgId}
    RETURNING id
  `) as Array<{ id: string }>;
  return result.length > 0;
}

/**
 * Get the total count of clients for an organization
 */
export async function dbGetClientsCount(orgId: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::integer as count
    FROM clients
    WHERE org_id = ${orgId}
  `) as Array<{ count: number }>;
  return rows[0]?.count || 0;
}
