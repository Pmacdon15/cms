import { sql } from "./neon";
import type { Client, ClientInput } from "../types/types";

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
 * Insert a new client into the database
 */
export async function dbCreateClient(input: ClientInput): Promise<Client> {
  const rows = await sql`
    INSERT INTO clients (name, email, phone_number, opt_in_newsletter, opt_in_sms)
    VALUES (${input.name}, ${input.email}, ${input.phone_number}, ${input.opt_in_newsletter}, ${input.opt_in_sms})
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `;
  return rows[0] as Client;
}

/**
 * Update opt-in status for a client
 */
export async function dbUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean
): Promise<Client> {
  const rows = await sql`
    UPDATE clients
    SET opt_in_newsletter = ${optInNewsletter}, opt_in_sms = ${optInSms}
    WHERE id = ${id}
    RETURNING id, name, email, phone_number, opt_in_newsletter, opt_in_sms, created_at
  `;
  if (rows.length === 0) {
    throw new Error(`Client with ID ${id} not found.`);
  }
  return rows[0] as Client;
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
