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
    const { orgId } = authResult.value;
    if (!orgId) {
      return err(new Error("Please select or create an organization."));
    }

    const clients = await dbGetClients(orgId);
    return ok(clients);
  } catch (error) {
    console.error("dalGetClients exception caught:", error);
    const message =
      error instanceof Error ? error.message : "Failed to retrieve clients list.";
    return err(new Error(message));
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
    const { orgId, isAdmin } = authResult.value;
    if (!orgId) {
      return err(new Error("Please select or create an organization."));
    }
    if (!isAdmin) {
      return err(new Error("Unauthorized. Only organization admins can add clients."));
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
    const newClient = await dbCreateClient(input, orgId);

    // 2. Subscribe them to default local mailing list
    await dbUpdateSubscriptionStatus(
      newClient.id,
      "TanStackFormNewsletter",
      "subscribed",
      orgId,
    );

    return ok(newClient);
  } catch (error) {
    console.error("dalCreateClient exception caught:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create client.";
    return err(new Error(message));
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
    const { orgId, isAdmin } = authResult.value;
    if (!orgId) {
      return err(new Error("Please select or create an organization."));
    }
    if (!isAdmin) {
      return err(new Error("Unauthorized. Only organization admins can update subscription preferences."));
    }

    const updatedClient = await dbUpdateClientOptIn(
      id,
      optInNewsletter,
      optInSms,
      orgId,
    );
    if (!updatedClient) {
      return err(new Error(`Client with ID ${id} not found.`));
    }

    return ok(updatedClient);
  } catch (error) {
    console.error("dalUpdateClientOptIn exception caught:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update channel subscriptions.";
    return err(new Error(message));
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
    const { orgId, isAdmin } = authResult.value;
    if (!orgId) {
      return err(new Error("Please select or create an organization."));
    }
    if (!isAdmin) {
      return err(new Error("Unauthorized. Only organization admins can delete clients."));
    }

    const success = await dbDeleteClient(id, orgId);
    if (!success) {
      return err(
        new Error(`Client with ID ${id} could not be found to delete.`),
      );
    }

    return ok(true);
  } catch (error) {
    console.error("dalDeleteClient exception caught:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete client record.";
    return err(new Error(message));
  }
}
