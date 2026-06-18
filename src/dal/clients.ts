import { auth } from "@clerk/nextjs/server";
import { err, ok, type Result } from "neverthrow";
import {
  dbCreateClient,
  dbDeleteClient,
  dbGetClientById,
  dbGetClients,
  dbGetClientsCount,
  dbSearchClients,
  dbUpdateClient,
  dbUpdateClientOptIn,
} from "../db/clients";
import { dbUpdateSubscriptionStatus } from "../db/mailing_lists";
import type { Client, ClientInput } from "../types/types";
import { checkAuth } from "./auth";

/**
 * Fetch clients with auth protection and filter parameters (search term or specific client)
 */
export async function dalGetClients(params?: {
  search?: string;
  client?: string;
}): Promise<{ ok: true; value: Client[] } | { ok: false; error: string }> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return { ok: false, error: authResult.error.message };
    }
    const { orgId } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    if (params?.client) {
      const client = await dbGetClientById(params.client, orgId);
      return { ok: true, value: client ? [client] : [] };
    }

    if (params?.search) {
      const clients = await dbSearchClients(orgId, params.search);
      return { ok: true, value: clients };
    }

    const clients = await dbGetClients(orgId);
    return { ok: true, value: clients };
  } catch (error) {
    console.error("dalGetClients exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve clients list.";
    return { ok: false, error: message };
  }
}

/**
 * Search clients for autocomplete suggestions
 */
export async function dalSearchClients(
  query: string,
): Promise<Result<Client[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }
    const { orgId } = authResult.value;
    if (!orgId) {
      return err(new Error("Please select or create an organization."));
    }

    if (!query.trim()) {
      return ok([]);
    }

    const clients = await dbSearchClients(orgId, query.trim());
    return ok(clients);
  } catch (error) {
    console.error("dalSearchClients exception caught:", error);
    const message =
      error instanceof Error ? error.message : "Failed to search clients.";
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
    const { orgId, has } = await auth.protect();
    const isAdmin = has({ role: "org:admin" });

    if (!isAdmin || !orgId) {
      return err(new Error("Unauthorized."));
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

    // Check client limit using .find with features
    const clientLimit =
      [100, 60, 30, 15].find((num) =>
        has({ feature: `${num}_clients_per_list` }),
      ) || 1;

    const currentCount = await dbGetClientsCount(orgId);
    if (currentCount >= clientLimit) {
      return err(
        new Error(
          `Client limit reached. This organization is limited to ${clientLimit} client(s).`,
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
      return err(
        new Error(
          "Unauthorized. Only organization admins can update subscription preferences.",
        ),
      );
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
      error instanceof Error
        ? error.message
        : "Failed to update channel subscriptions.";
    return err(new Error(message));
  }
}

/**
 * Update a client's main profile details (name, email, phone)
 */
export async function dalUpdateClient(
  id: string,
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
      return err(
        new Error(
          "Unauthorized. Only organization admins can update client details.",
        ),
      );
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

    const updatedClient = await dbUpdateClient(id, input, orgId);
    if (!updatedClient) {
      return err(new Error(`Client with ID ${id} not found.`));
    }

    return ok(updatedClient);
  } catch (error) {
    console.error("dalUpdateClient exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update client details.";
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
      return err(
        new Error("Unauthorized. Only organization admins can delete clients."),
      );
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
      error instanceof Error
        ? error.message
        : "Failed to delete client record.";
    return err(new Error(message));
  }
}
