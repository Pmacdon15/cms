import { err, ok, type Result } from "neverthrow";
import {
  dbGetClientByEmail,
  dbGetClientById,
  dbUpdateClientOptIn,
} from "../db/clients";
import {
  dbCreateMailingList,
  dbGetClientSubscriptionsByEmail,
  dbGetClientSubscriptionsById,
  dbGetMailingListSubscribers,
  dbGetMailingLists,
  dbUpdateSubscriptionStatus,
  dbUpdateSubscriptionStatusByEmail,
} from "../db/mailing_lists";
import type { MailingList } from "../types/types";
import { checkAuth } from "./auth";

/**
 * Helper to check if a string is a valid UUID
 */
function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/**
 * Fetch all mailing lists from the database (Admin authenticated)
 */
export async function dalGetMailingLists(): Promise<
  Result<MailingList[], Error>
> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const lists = await dbGetMailingLists();
    return ok(lists);
  } catch (error: any) {
    console.error("dalGetMailingLists exception:", error);
    return err(
      new Error(
        error?.message || "Failed to retrieve mailing lists from database.",
      ),
    );
  }
}

/**
 * Create a new mailing list in the database (Admin authenticated)
 */
export async function dalCreateMailingList(
  name: string,
  description?: string,
): Promise<Result<MailingList, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    if (!name.trim()) {
      return err(new Error("Mailing list name is required."));
    }

    const cleanName = name.trim().replace(/\s+/g, "_"); // Keep list name clean
    const list = await dbCreateMailingList(cleanName, description?.trim());
    return ok(list);
  } catch (error: any) {
    console.error("dalCreateMailingList exception:", error);
    return err(
      new Error(error?.message || "Failed to create mailing list in database."),
    );
  }
}

/**
 * Fetch all subscribers on a mailing list (Admin authenticated)
 */
export async function dalGetMailingListSubscribers(listName: string): Promise<
  Result<
    Array<{
      id: string;
      name: string;
      email: string;
      phone_number: string;
      status: "subscribed" | "unsubscribed";
    }>,
    Error
  >
> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const subscribers = await dbGetMailingListSubscribers(listName);
    return ok(subscribers);
  } catch (error: any) {
    console.error("dalGetMailingListSubscribers exception:", error);
    return err(
      new Error(
        error?.message || "Failed to retrieve subscribers from database.",
      ),
    );
  }
}

/**
 * Public resolver to retrieve dynamic mailing list preferences by email
 */
export async function dalGetClientSubscriptionsByEmail(email: string): Promise<
  Result<
    {
      client: { id: string; name: string; email: string } | null;
      globalOptIn: boolean;
      subscriptions: Array<{
        listName: string;
        description: string;
        status: "subscribed" | "unsubscribed";
      }>;
    },
    Error
  >
> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return err(new Error("Email address is required."));
    }

    const res = await dbGetClientSubscriptionsByEmail(cleanEmail);
    if (!res) {
      return err(new Error(`Subscriber with email ${cleanEmail} not found.`));
    }

    return ok(res);
  } catch (error: any) {
    console.error("dalGetClientSubscriptionsByEmail exception:", error);
    return err(
      new Error(error?.message || "Failed to retrieve subscription preferences."),
    );
  }
}

/**
 * Public resolver to retrieve dynamic mailing list preferences securely by client UUID
 */
export async function dalGetClientSubscriptionsById(id: string): Promise<
  Result<
    {
      client: { id: string; name: string; email: string } | null;
      globalOptIn: boolean;
      subscriptions: Array<{
        listName: string;
        description: string;
        status: "subscribed" | "unsubscribed";
      }>;
    },
    Error
  >
> {
  try {
    const cleanId = id.trim();
    if (!cleanId || !isUuidString(cleanId)) {
      return err(new Error("Valid subscriber reference (UUID) is required."));
    }

    const res = await dbGetClientSubscriptionsById(cleanId);
    if (!res) {
      return err(new Error("Subscriber not found."));
    }

    return ok(res);
  } catch (error: any) {
    console.error("dalGetClientSubscriptionsById exception:", error);
    return err(
      new Error(
        error?.message || "Failed to retrieve subscriber preferences by ID.",
      ),
    );
  }
}

/**
 * Updates a subscriber's status on a specific mailing list
 */
export async function dalUpdateSubscriptionStatus(
  clientIdOrEmail: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  isPublic = false,
): Promise<Result<boolean, Error>> {
  try {
    // Authenticate if this is not a public unsubscribe form submission
    if (!isPublic) {
      const authResult = await checkAuth();
      if (authResult.isErr()) return err(authResult.error);
    }

    const cleanInput = clientIdOrEmail.trim();
    if (!cleanInput) {
      return err(new Error("Subscriber identifier is required."));
    }

    if (isUuidString(cleanInput)) {
      await dbUpdateSubscriptionStatus(cleanInput, listName, status);
    } else {
      const success = await dbUpdateSubscriptionStatusByEmail(
        cleanInput.toLowerCase(),
        listName,
        status,
      );
      if (!success) {
        return err(new Error(`Subscriber with email ${cleanInput} not found.`));
      }
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalUpdateSubscriptionStatus exception:", error);
    return err(
      new Error(error?.message || "Failed to update subscription preference."),
    );
  }
}

/**
 * Updates a subscriber's global newsletter preferences in the database (Unauthenticated/Public)
 */
export async function dalUpdateGlobalOptIn(
  clientIdOrEmail: string,
  optInNewsletter: boolean,
): Promise<Result<boolean, Error>> {
  try {
    const cleanInput = clientIdOrEmail.trim();
    if (!cleanInput) {
      return err(new Error("Subscriber identifier is required."));
    }

    const isUuid = isUuidString(cleanInput);
    const client = isUuid
      ? await dbGetClientById(cleanInput)
      : await dbGetClientByEmail(cleanInput.toLowerCase());

    if (!client) {
      return err(new Error("Subscriber profile not found."));
    }

    // Update global subscription status on client
    await dbUpdateClientOptIn(client.id, optInNewsletter, client.opt_in_sms);

    // Sync all specific lists to match the global toggle
    const lists = await dbGetMailingLists();
    const targetStatus = optInNewsletter ? "subscribed" : "unsubscribed";

    for (const list of lists) {
      await dbUpdateSubscriptionStatus(client.id, list.name, targetStatus);
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalUpdateGlobalOptIn exception:", error);
    return err(
      new Error(error?.message || "Failed to update global preferences."),
    );
  }
}
