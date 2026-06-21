import { auth } from "@clerk/nextjs/server";
import { err, ok } from "neverthrow";
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
import type { AppResult, Client, ClientInput } from "../types/types";

/**
 * Fetch clients with auth protection and filter parameters (search term or specific client)
 */
export async function dalGetClients(params?: {
  search?: string;
  client?: string;
}): Promise<AppResult<Client[]>> {
  const { orgId } = await auth.protect();
  try {
    if (!orgId) {
      return err({ reason: "Please select or create an organization." });
    }

    if (params?.client) {
      const client = await dbGetClientById(params.client, orgId);
      return ok(client ? [client] : []);
    }

    if (params?.search) {
      const clients = await dbSearchClients(orgId, params.search);
      return ok(clients);
    }

    const clients = await dbGetClients(orgId);
    return ok(clients);
  } catch (error) {
    console.error("dalGetClients exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve clients list.";
    return err({ reason: message });
  }
}

/**
 * Search clients for autocomplete suggestions
 */
export async function dalSearchClients(
  query: string,
): Promise<AppResult<Client[]>> {
  const { orgId } = await auth.protect();
  try {
    if (!orgId) {
      return err({ reason: "Please select or create an organization." });
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
    return err({ reason: message });
  }
}

/**
 * Create a new client, write to DB, and subscribe to default mailing list locally
 */
export async function dalCreateClient(
  input: ClientInput,
): Promise<AppResult<Client>> {
  const { orgId, has } = await auth.protect();
  try {
    const isAdmin = has({ role: "org:admin" });

    if (!isAdmin || !orgId) {
      return err({ reason: "Unauthorized." });
    }

    if (
      !input.name.trim() ||
      !input.email.trim() ||
      !input.phone_number.trim()
    ) {
      return err({
        reason:
          "Missing required client fields (Name, Email, and Phone are mandatory).",
      });
    }

    const clientLimit =
      [100, 60, 30, 15].find((num) =>
        has({ feature: `${num}_clients_per_list` }),
      ) || 1;

    const currentCount = await dbGetClientsCount(orgId);
    if (currentCount >= clientLimit) {
      return err({
        reason: `Client limit reached. This organization is limited to ${clientLimit} client(s).`,
      });
    }

    const newClient = await dbCreateClient(input, orgId);

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
    return err({ reason: message });
  }
}

/**
 * Opt-in/opt-out toggles for client messaging channels, writing directly to DB
 */
export async function dalUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean,
): Promise<AppResult<Client>> {
  const { orgId, has } = await auth.protect();
  try {
    if (!has({ role: "org:admin" }) || !orgId) {
      return err({
        reason:
          "Unauthorized. Only organization admins can update subscription preferences.",
      });
    }

    const updatedClient = await dbUpdateClientOptIn(
      id,
      optInNewsletter,
      optInSms,
      orgId,
    );
    if (!updatedClient) {
      return err({ reason: `Client with ID ${id} not found.` });
    }

    return ok(updatedClient);
  } catch (error) {
    console.error("dalUpdateClientOptIn exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update channel subscriptions.";
    return err({ reason: message });
  }
}

/**
 * Update a client's main profile details (name, email, phone)
 */
export async function dalUpdateClient(
  id: string,
  input: ClientInput,
): Promise<AppResult<Client>> {
  const { orgId, has } = await auth.protect();
  try {
    if (!has({ role: "org:admin" }) || !orgId) {
      return err({
        reason:
          "Unauthorized. Only organization admins can update client details.",
      });
    }

    if (
      !input.name.trim() ||
      !input.email.trim() ||
      !input.phone_number.trim()
    ) {
      return err({
        reason:
          "Missing required client fields (Name, Email, and Phone are mandatory).",
      });
    }

    const updatedClient = await dbUpdateClient(id, input, orgId);
    if (!updatedClient) {
      return err({ reason: `Client with ID ${id} not found.` });
    }

    return ok(updatedClient);
  } catch (error) {
    console.error("dalUpdateClient exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update client details.";
    return err({ reason: message });
  }
}

/**
 * Delete a client
 */
export async function dalDeleteClient(id: string): Promise<AppResult<boolean>> {
  const { orgId, has } = await auth.protect();
  try {
    if (!has({ role: "org:admin" }) || !orgId) {
      return err({
        reason: "Unauthorized. Only organization admins can delete clients.",
      });
    }

    const success = await dbDeleteClient(id, orgId);
    if (!success) {
      return err({
        reason: `Client with ID ${id} could not be found to delete.`,
      });
    }

    return ok(true);
  } catch (error) {
    console.error("dalDeleteClient exception caught:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete client record.";
    return err({ reason: message });
  }
}
