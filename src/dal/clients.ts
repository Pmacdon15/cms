import { err, ok, type Result } from "neverthrow";
import {
  dbCreateClient,
  dbDeleteClient,
  dbGetClients,
  dbUpdateClientOptIn,
} from "../db/clients";
import { dbUpdateSubscriptionStatus } from "../db/mailing_lists";
import type { Client, ClientInput } from "../types/types";
import { checkAuth } from "./auth";

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
 * Create a new client, write to DB, and subscribe to default mailing list locally
 */
export async function dalCreateClient(
  input: ClientInput,
): Promise<Result<Client, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    // Input verification
    if (
      !input.name.trim() ||
      !input.email.trim() ||
      !input.phone_number.trim()
    ) {
      return err(
        new Error(
          "Missing required client fields (Name, Email, and Phone are mandatory).",
        ),
      );
    }

    // 1. Write client to DB
    const newClient = await dbCreateClient(input);

    // 2. Subscribe them to default local mailing list
    await dbUpdateSubscriptionStatus(
      newClient.id,
      "TanStackFormNewsletter",
      "subscribed",
    );

    return ok(newClient);
  } catch (error: any) {
    console.error("dalCreateClient exception caught:", error);
    return err(new Error(error?.message || "Failed to create client."));
  }
}

/**
 * Opt-in/opt-out toggles for client messaging channels, writing directly to DB
 */
export async function dalUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean,
): Promise<Result<Client, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    const updatedClient = await dbUpdateClientOptIn(
      id,
      optInNewsletter,
      optInSms,
    );
    if (!updatedClient) {
      return err(new Error(`Client with ID ${id} not found.`));
    }

    return ok(updatedClient);
  } catch (error: any) {
    console.error("dalUpdateClientOptIn exception caught:", error);
    return err(
      new Error(error?.message || "Failed to update channel subscriptions."),
    );
  }
}

/**
 * Delete a client
 */
export async function dalDeleteClient(
  id: string,
): Promise<Result<boolean, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    const success = await dbDeleteClient(id);
    if (!success) {
      return err(
        new Error(`Client with ID ${id} could not be found to delete.`),
      );
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalDeleteClient exception caught:", error);
    return err(new Error(error?.message || "Failed to delete client record."));
  }
}
