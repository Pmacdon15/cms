import { sql } from "./neon";
import type { Client, ClientInput } from "../types/types";

/**
 * Fetch all clients, sorted newest first (without local opt_in columns)
 */
export async function dbGetClients(): Promise<Omit<Client, "opt_in_newsletter" | "opt_in_sms">[]> {
  const rows = await sql`
    SELECT id, name, email, phone_number, created_at 
    FROM clients 
    ORDER BY created_at DESC
  `;
  return rows as Omit<Client, "opt_in_newsletter" | "opt_in_sms">[];
}

/**
 * Fetch a single client by ID (without local opt_in columns)
 */
export async function dbGetClientById(id: string): Promise<Omit<Client, "opt_in_newsletter" | "opt_in_sms"> | null> {
  const rows = await sql`
    SELECT id, name, email, phone_number, created_at 
    FROM clients 
    WHERE id = ${id}
  `;
  if (rows.length === 0) return null;
  return rows[0] as Omit<Client, "opt_in_newsletter" | "opt_in_sms">;
}

/**
 * Fetch a single client by Email (without local opt_in columns)
 */
export async function dbGetClientByEmail(email: string): Promise<Omit<Client, "opt_in_newsletter" | "opt_in_sms"> | null> {
  const rows = await sql`
    SELECT id, name, email, phone_number, created_at 
    FROM clients 
    WHERE email = ${email}
  `;
  if (rows.length === 0) return null;
  return rows[0] as Omit<Client, "opt_in_newsletter" | "opt_in_sms">;
}

/**
 * Insert a new client into the database
 */
export async function dbCreateClient(input: ClientInput): Promise<Omit<Client, "opt_in_newsletter" | "opt_in_sms">> {
  const rows = await sql`
    INSERT INTO clients (name, email, phone_number)
    VALUES (${input.name}, ${input.email}, ${input.phone_number})
    RETURNING id, name, email, phone_number, created_at
  `;
  return rows[0] as Omit<Client, "opt_in_newsletter" | "opt_in_sms">;
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
