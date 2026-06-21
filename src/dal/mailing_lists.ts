import { auth } from "@clerk/nextjs/server";
import { isOverMemberShipLimit } from "@/db/clerk";
import { dbGetCampaignsCountThisWeek } from "../db/campaigns";
import {
  dbGetClientByEmail,
  dbGetClientById,
  dbUpdateClientOptIn,
} from "../db/clients";
import {
  dbCreateMailingList,
  dbDeleteMailingList,
  dbEditMailingList,
  dbGetClientSubscriptionsByEmail,
  dbGetClientSubscriptionsById,
  dbGetMailingListSubscribers,
  dbGetMailingListSubscribersCount,
  dbGetMailingLists,
  dbGetMailingListsCount,
  dbRebalanceListsForOrg,
  dbRebalanceSubscribersForList,
  dbUpdateSubscriptionStatus,
  dbUpdateSubscriptionStatusByEmail,
} from "../db/mailing_lists";
import { sql } from "../db/neon";
import type { MailingList } from "../types/types";
import { getOrgFeatures } from "./clerk";

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
    const { orgId, has } = await auth.protect();

    if (!orgId) {
      return { ok: false, error: "Please select or create an organization." };
    }

    const [lists, isOverMemberShipLimitValue] = await Promise.all([
      dbGetMailingLists(orgId),
      isOverMemberShipLimit(orgId),
    ]);

    if (isOverMemberShipLimitValue) {
      return { ok: false, error: `Over organization membership limit.` };
    }

    const campaignLimit =
      [15, 10, 5].find((num) => has({ feature: `${num}_campaigns_a_week` })) ||
      1;

    const listsWithUsage = await Promise.all(
      lists.map(async (list) => {
        const count = await dbGetCampaignsCountThisWeek(orgId, list.name);
        return {
          ...list,
          campaignsSentThisWeek: count,
          campaignLimit,
        };
      }),
    );

    return { ok: true, value: listsWithUsage };
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
    const { orgId, has } = await auth.protect();
    const isAdmin = has({ role: "org:admin" });

    if (!isAdmin || !orgId) {
      return {
        ok: false,
        error: "Unauthorized.",
      };
    }

    if (!name.trim()) {
      return { ok: false, error: "Mailing list name is required." };
    }

    const mailingListLimit =
      [15, 10, 5].find(async (num) =>
        has?.({ feature: `${num}_mailing_list` }),
      ) || 1;

    const currentListCount = await dbGetMailingListsCount(orgId);
    if (currentListCount >= mailingListLimit) {
      return {
        ok: false,
        error: `Mailing list limit reached. This organization is limited to ${mailingListLimit} mailing list(s).`,
      };
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
    const { orgId } = await auth.protect();

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

    const normalized = {
      ...res,
      client: res.client ? { ...res.client, id: String(res.client.id) } : null,
    };

    return { ok: true, value: normalized };
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

    const normalized = {
      ...res,
      client: res.client ? { ...res.client, id: String(res.client.id) } : null,
    };

    return { ok: true, value: normalized };
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
    let resolvedOrgId: string | null = null;
    let hasCheck: Awaited<ReturnType<typeof auth.protect>>["has"] | null = null;

    if (!isPublic) {
      const { orgId, has } = await auth.protect();
      const isAdmin = has({ role: "org:admin" });

      if (!isAdmin || !orgId) {
        return {
          ok: false,
          error: "Unauthorized.",
        };
      }
      resolvedOrgId = orgId;
      hasCheck = has;
    }

    const cleanInput = clientIdOrEmail.trim();
    if (!cleanInput) {
      return { ok: false, error: "Subscriber identifier is required." };
    }

    if (!resolvedOrgId) {
      const clientRows = (
        isUuidString(cleanInput)
          ? ((await sql`SELECT org_id FROM clients WHERE id = ${cleanInput}`) as {
              org_id: string;
            })
          : await sql`SELECT org_id FROM clients WHERE email = ${cleanInput.toLowerCase()}`
      ) as Array<{ org_id: string }>;

      if (clientRows.length === 0) {
        return {
          ok: false,
          error: "Subscriber or associated organization not found.",
        };
      }
      resolvedOrgId = clientRows[0].org_id;
    }

    // 3. Enforce Limit Safeguards when moving a subscriber to 'subscribed'
    if (status === "subscribed") {
      let clientLimit = 1;

      if (!isPublic && hasCheck) {
        clientLimit =
          [100, 60, 30, 15].find((num) =>
            hasCheck({ feature: `${num}_clients_per_list` }),
          ) || 1;
      } else {
        const features = await getOrgFeatures(resolvedOrgId || "");
        const normalized = features.map((f) =>
          f.toLowerCase().replace(/-/g, "_"),
        );
        clientLimit =
          [100, 60, 30, 15].find((num) =>
            normalized.some((f) => f.includes(`${num}_client`)),
          ) || 1;
      }

      // Check existing subscription footprint
      const existingSub = (
        isUuidString(cleanInput)
          ? await sql`SELECT status FROM mailing_list_subscriptions WHERE client_id = ${cleanInput} AND mailing_list_name = ${listName} AND org_id = ${resolvedOrgId}`
          : await sql`SELECT mls.status FROM mailing_list_subscriptions mls JOIN clients c ON c.id = mls.client_id WHERE c.email = ${cleanInput.toLowerCase()} AND mls.mailing_list_name = ${listName} AND mls.org_id = ${resolvedOrgId}`
      ) as Array<{ status: string }>;

      const isAlreadySubscribed =
        existingSub.length > 0 && existingSub[0].status === "subscribed";

      if (!isAlreadySubscribed) {
        const currentCount = await dbGetMailingListSubscribersCount(
          listName,
          resolvedOrgId,
        );
        if (currentCount >= clientLimit) {
          // Force or leave as unsubscribed to block exceeding tier metrics
          if (isUuidString(cleanInput)) {
            await dbUpdateSubscriptionStatus(
              cleanInput,
              listName,
              "unsubscribed",
              resolvedOrgId,
            );
          } else {
            await dbUpdateSubscriptionStatusByEmail(
              cleanInput.toLowerCase(),
              listName,
              "unsubscribed",
              resolvedOrgId,
            );
          }
          return {
            ok: false,
            error: `Limit reached. This mailing list is limited to ${clientLimit} active subscribers.`,
          };
        }
      }
    }

    // 4. Fire final targeted DB mutations
    if (isUuidString(cleanInput)) {
      await dbUpdateSubscriptionStatus(
        cleanInput,
        listName,
        status,
        resolvedOrgId,
      );
    } else {
      const success = await dbUpdateSubscriptionStatusByEmail(
        cleanInput.toLowerCase(),
        listName,
        status,
        resolvedOrgId,
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
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update subscription preference.",
    };
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

/**
 * Delete a mailing list (sets status = 'deleted')
 */
export async function dalDeleteMailingList(
  name: string,
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  try {
    const { orgId, has } = await auth.protect();

    if (!has({ role: "org:admin" }) || !orgId) {
      return {
        ok: false,
        error:
          "Unauthorized. Only organization admins can delete mailing lists.",
      };
    }

    const success = await dbDeleteMailingList(name, orgId);
    return { ok: true, value: success };
  } catch (error) {
    console.error("dalDeleteMailingList exception:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete mailing list.";
    return { ok: false, error: message };
  }
}

/**
 * Rename a mailing list and its references
 */
export async function dalEditMailingList(
  oldName: string,
  newName: string,
  description?: string,
): Promise<{ ok: true; value: MailingList } | { ok: false; error: string }> {
  try {
    const { orgId, has } = await auth.protect();

    if (!has({ role: "org:admin" }) || !orgId) {
      return {
        ok: false,
        error: "Unauthorized. Only organization admins can edit mailing lists.",
      };
    }

    if (!newName.trim()) {
      return { ok: false, error: "New mailing list name is required." };
    }

    const cleanNewName = newName.trim().replace(/\s+/g, "_");
    const list = await dbEditMailingList(
      oldName,
      cleanNewName,
      description?.trim(),
      orgId,
    );
    return { ok: true, value: list };
  } catch (error) {
    console.error("dalEditMailingList exception:", error);
    const message =
      error instanceof Error ? error.message : "Failed to edit mailing list.";
    return { ok: false, error: message };
  }
}

/**
 * Rebalance mailing lists for a specific organization without auth checks
 */
export async function dalRebalanceListsForOrg(orgId: string): Promise<{
  limit: number;
  activated: string[];
  disabled: string[];
}> {
  const features = await getOrgFeatures(orgId);
  let mailingListLimit = 1; // default limit

  if (features.includes("15_mailing_list")) {
    mailingListLimit = 15;
  } else if (features.includes("10_mailing_list")) {
    mailingListLimit = 10;
  } else if (features.includes("5_mailing_list")) {
    mailingListLimit = 5;
  } else {
    mailingListLimit = 1;
  }

  const result = await dbRebalanceListsForOrg(orgId, mailingListLimit);
  return {
    limit: mailingListLimit,
    activated: result.activated,
    disabled: result.disabled,
  };
}

/**
 * Rebalance subscribers across all mailing lists for a specific organization without auth checks
 */
export async function dalRebalanceSubscribersForOrg(orgId: string): Promise<{
  clientLimit: number;
  listsProcessed: Array<{ listName: string; unsubscribedCount: number }>;
}> {
  const features = await getOrgFeatures(orgId);
  let clientLimit = 1; // default limit

  if (
    features.includes("100_clients_per_list") ||
    features.includes("100_clients_pre_list")
  ) {
    clientLimit = 100;
  } else if (
    features.includes("60_clients_per_list") ||
    features.includes("60_clients_pre_list")
  ) {
    clientLimit = 60;
  } else if (
    features.includes("30_clients_per_list") ||
    features.includes("30_clients_pre_list")
  ) {
    clientLimit = 30;
  } else if (
    features.includes("15_clients_per_list") ||
    features.includes("15_clients_pre_list")
  ) {
    clientLimit = 15;
  } else {
    clientLimit = 1;
  }

  const lists = await dbGetMailingLists(orgId);
  const listsProcessed: Array<{ listName: string; unsubscribedCount: number }> =
    [];

  for (const list of lists) {
    const unsubscribedIds = await dbRebalanceSubscribersForList(
      orgId,
      list.name,
      clientLimit,
    );
    listsProcessed.push({
      listName: list.name,
      unsubscribedCount: unsubscribedIds.length,
    });
  }

  return {
    clientLimit,
    listsProcessed,
  };
}
