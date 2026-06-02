import { Result, err, ok } from "neverthrow";
import { checkAuth } from "./auth";
import {
  dbCreateClient,
  dbDeleteClient,
  dbGetClients,
  dbGetClientById,
} from "../db/clients";
import {
  getAwsSubscriptionStatuses,
  updateAwsSubscriptionStatus,
  awsAddContactToList,
} from "../services/aws";
import type { Client, ClientInput } from "../types/types";

/**
 * Fetch all clients with auth protection, merging their AWS-driven opt-in states
 */
export async function dalGetClients(): Promise<Result<Client[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) {
      return err(authResult.error);
    }

    // 1. Fetch raw client metadata from DB
    const dbClients = await dbGetClients();
    if (dbClients.length === 0) {
      return ok([]);
    }

    // 2. Fetch opt-in preferences dynamically from AWS in a single batch
    const emails = dbClients.map((c) => c.email);
    const awsStatuses = await getAwsSubscriptionStatuses(emails);

    // 3. Merge DB attributes with AWS preference statuses
    const clients: Client[] = dbClients.map((c) => ({
      ...c,
      opt_in_newsletter: awsStatuses[c.email]?.optInNewsletter ?? true,
      opt_in_sms: awsStatuses[c.email]?.optInSms ?? true,
    }));

    return ok(clients);
  } catch (error: any) {
    console.error("dalGetClients exception caught:", error);
    return err(new Error(error?.message || "Failed to retrieve clients list."));
  }
}

/**
 * Create a new client, write to DB, and register them on the AWS SES Contact List
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

    // 1. Write client to DB (no opt_in columns)
    const newDbClient = await dbCreateClient(input);

    // 2. Add contact to default SES Contact List
    const sesAdded = await awsAddContactToList(newDbClient.email, newDbClient.name, "TanStackFormNewsletter");
    if (!sesAdded) {
      console.warn(`[DAL Warning] Client registered locally, but AWS SES Contact List addition failed for: ${newDbClient.email}`);
    }

    // 3. Assemble full Client response with default opt-ins (since newly registered)
    const client: Client = {
      ...newDbClient,
      opt_in_newsletter: true,
      opt_in_sms: true,
    };

    return ok(client);
  } catch (error: any) {
    console.error("dalCreateClient exception caught:", error);
    return err(new Error(error?.message || "Failed to create and synchronize client."));
  }
}

/**
 * Opt-in/opt-out toggles for client messaging channels, writing directly to AWS
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

    // 1. Fetch client from DB to resolve their email
    const dbClient = await dbGetClientById(id);
    if (!dbClient) {
      return err(new Error(`Client with ID ${id} not found.`));
    }

    // 2. Write preferences directly to AWS SES Contact List / Pinpoint attributes
    const awsUpdated = await updateAwsSubscriptionStatus(dbClient.email, optInNewsletter, optInSms);
    if (!awsUpdated) {
      return err(new Error("Failed to synchronize subscription preferences to AWS."));
    }

    // 3. Assemble and return full Client object
    const client: Client = {
      ...dbClient,
      opt_in_newsletter: optInNewsletter,
      opt_in_sms: optInSms,
    };

    return ok(client);
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
