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
  { ok: true; value: MailingList[] } | { ok: false; error: string }
> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const lists = await dbGetMailingLists(orgId);
    return { ok: true, value: lists };
  } catch (error) {
    console.error("dalGetMailingLists exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve mailing lists from database.";
    return { ok: false, error: message };
  }
}

/**
 * Create a new mailing list in the database (Admin authenticated)
 */
export async function dalCreateMailingList(
  name: string,
  description?: string,
): Promise<{ ok: true; value: MailingList } | { ok: false; error: string }> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId, isAdmin } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }
    if (!isAdmin) {
      return {
        ok: false,
        error:
          "Unauthorized. Only organization admins can create mailing lists.",
      };
    }

    if (!name.trim()) {
      return { ok: false, error: "Mailing list name is required." };
    }

    const cleanName = name.trim().replace(/\s+/g, "_"); // Keep list name clean
    const list = await dbCreateMailingList(
      cleanName,
      description?.trim(),
      orgId,
    );
    return { ok: true, value: list };
  } catch (error) {
    console.error("dalCreateMailingList exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create mailing list in database.";
    return { ok: false, error: message };
  }
}

/**
 * Fetch all subscribers on a mailing list (Admin authenticated)
 */
export async function dalGetMailingListSubscribers(listName: string): Promise<
  | {
      ok: true;
      value: Array<{
        id: string;
        name: string;
        email: string;
        phone_number: string;
        status: "subscribed" | "unsubscribed";
      }>;
    }
  | { ok: false; error: string }
> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr())
      return { ok: false, error: authResult.error.message };
    const { orgId } = authResult.value;
    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const subscribers = await dbGetMailingListSubscribers(listName, orgId);
    return { ok: true, value: subscribers };
  } catch (error) {
    console.error("dalGetMailingListSubscribers exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve subscribers from database.";
    return { ok: false, error: message };
  }
}

/**
 * Public resolver to retrieve dynamic mailing list preferences by email
 */
export async function dalGetClientSubscriptionsByEmail(email: string): Promise<
  | {
      ok: true;
      value: {
        client: { id: string; name: string; email: string } | null;
        globalOptIn: boolean;
        subscriptions: Array<{
          listName: string;
          description: string;
          status: "subscribed" | "unsubscribed";
        }>;
      };
    }
  | { ok: false; error: string }
> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, error: "Email address is required." };
    }

    const res = await dbGetClientSubscriptionsByEmail(cleanEmail);
    if (!res) {
      return {
        ok: false,
        error: `Subscriber with email ${cleanEmail} not found.`,
      };
    }

    return { ok: true, value: res };
  } catch (error) {
    console.error("dalGetClientSubscriptionsByEmail exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve subscription preferences.";
    return { ok: false, error: message };
  }
}

/**
 * Public resolver to retrieve dynamic mailing list preferences securely by client UUID
 */
export async function dalGetClientSubscriptionsById(id: string): Promise<
  | {
      ok: true;
      value: {
        client: { id: string; name: string; email: string } | null;
        globalOptIn: boolean;
        subscriptions: Array<{
          listName: string;
          description: string;
          status: "subscribed" | "unsubscribed";
        }>;
      };
    }
  | { ok: false; error: string }
> {
  try {
    const cleanId = id.trim();
    if (!cleanId || !isUuidString(cleanId)) {
      return {
        ok: false,
        error: "Valid subscriber reference (UUID) is required.",
      };
    }

    const res = await dbGetClientSubscriptionsById(cleanId);
    if (!res) {
      return { ok: false, error: "Subscriber not found." };
    }

    return { ok: true, value: res };
  } catch (error) {
    console.error("dalGetClientSubscriptionsById exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve subscriber preferences by ID.";
    return { ok: false, error: message };
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
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  try {
    let orgId: string | undefined;

    // Authenticate if this is not a public unsubscribe form submission
    if (!isPublic) {
      const authResult = await checkAuth();
      if (authResult.isErr())
        return { ok: false, error: authResult.error.message };
      const session = authResult.value;
      if (!session.orgId) {
        return { ok: false, error: "Please select or create an organization." };
      }
      if (!session.isAdmin) {
        return {
          ok: false,
          error:
            "Unauthorized. Only organization admins can update subscription statuses.",
        };
      }
      orgId = session.orgId;
    }

    const cleanInput = clientIdOrEmail.trim();
    if (!cleanInput) {
      return { ok: false, error: "Subscriber identifier is required." };
    }

    if (isUuidString(cleanInput)) {
      await dbUpdateSubscriptionStatus(cleanInput, listName, status, orgId);
    } else {
      const success = await dbUpdateSubscriptionStatusByEmail(
        cleanInput.toLowerCase(),
        listName,
        status,
        orgId,
      );
      if (!success) {
        return {
          ok: false,
          error: `Subscriber with email ${cleanInput} not found.`,
        };
      }
    }

    return { ok: true, value: true };
  } catch (error) {
    console.error("dalUpdateSubscriptionStatus exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update subscription preference.";
    return { ok: false, error: message };
  }
}

/**
 * Updates a subscriber's global newsletter preferences in the database (Unauthenticated/Public)
 */
export async function dalUpdateGlobalOptIn(
  clientIdOrEmail: string,
  optInNewsletter: boolean,
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  try {
    const cleanInput = clientIdOrEmail.trim();
    if (!cleanInput) {
      return { ok: false, error: "Subscriber identifier is required." };
    }

    const isUuid = isUuidString(cleanInput);
    const client = isUuid
      ? await dbGetClientById(cleanInput)
      : await dbGetClientByEmail(cleanInput.toLowerCase());

    if (!client) {
      return { ok: false, error: "Subscriber profile not found." };
    }

    // Update global subscription status on client
    await dbUpdateClientOptIn(client.id, optInNewsletter, client.opt_in_sms);

    // Sync all specific lists to match the global toggle
    const lists = await dbGetMailingLists(client.org_id);
    const targetStatus = optInNewsletter ? "subscribed" : "unsubscribed";

    for (const list of lists) {
      await dbUpdateSubscriptionStatus(
        client.id,
        list.name,
        targetStatus,
        client.org_id,
      );
    }

    return { ok: true, value: true };
  } catch (error) {
    console.error("dalUpdateGlobalOptIn exception:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update global preferences.";
    return { ok: false, error: message };
  }
}
