import { Result, err, ok } from "neverthrow";
import { checkAuth } from "./auth";
import {
  dbCreateClient,
  dbDeleteClient,
  dbGetClients,
  dbUpdateClientOptIn,
} from "../db/clients";
import { syncClientToAws } from "../services/aws";
import type { Client, ClientInput } from "../types/types";

/**
 * Fetch all clients with auth protection
 */
export async function dalGetClients(): Promise<Result<Client[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    const clients = await dbGetClients();
    return ok(clients);
  } catch (error: any) {
    console.error("dalGetClients exception caught:", error);
    return err(new Error(error?.message || "Failed to retrieve clients list."));
  }
}

/**
 * Create a new client, write to DB, and sync to AWS Pinpoint segment
 */
export async function dalCreateClient(input: ClientInput): Promise<Result<Client, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    // Input verification
    if (!input.name.trim() || !input.email.trim() || !input.phone_number.trim()) {
      return err(new Error("Missing required client fields (Name, Email, and Phone are mandatory)."));
    }

    // 1. Write client in database
    const newClient = await dbCreateClient(input);

    // 2. Sync client to AWS Pinpoint & SES (runs in background/async, but we handle it safely)
    const awsSync = await syncClientToAws(newClient);
    if (!awsSync.success) {
      console.warn(`[DAL Warning] Client registered locally, but AWS Pinpoint sync failed for: ${newClient.email}`);
    }

    return ok(newClient);
  } catch (error: any) {
    console.error("dalCreateClient exception caught:", error);
    return err(new Error(error?.message || "Failed to create and synchronize client."));
  }
}

/**
 * Opt-in/opt-out toggles for client messaging channels
 */
export async function dalUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean
): Promise<Result<Client, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    // 1. Update in local DB
    const updatedClient = await dbUpdateClientOptIn(id, optInNewsletter, optInSms);

    // 2. Synchronize new opt-in state to AWS Pinpoint
    const awsSync = await syncClientToAws(updatedClient);
    if (!awsSync.success) {
      console.warn(`[DAL Warning] Opt-in updated locally, but AWS Pinpoint sync failed for: ${updatedClient.email}`);
    }

    return ok(updatedClient);
  } catch (error: any) {
    console.error("dalUpdateClientOptIn exception caught:", error);
    return err(new Error(error?.message || "Failed to update channel subscriptions."));
  }
}

/**
 * Delete a client
 */
export async function dalDeleteClient(id: string): Promise<Result<boolean, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    const success = await dbDeleteClient(id);
    if (!success) {
      return err(new Error(`Client with ID ${id} could not be found to delete.`));
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalDeleteClient exception caught:", error);
    return err(new Error(error?.message || "Failed to delete client record."));
  }
}
