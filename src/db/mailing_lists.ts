import type { MailingList } from "../types/types";
import { sql } from "./neon";

/**
 * Ensure default mailing lists exist for the organization
 */
export async function ensureDefaultMailingLists(orgId: string): Promise<void> {
  try {
    await sql`
      INSERT INTO mailing_lists (name, description, org_id) VALUES
      ('TanStackFormNewsletter', 'Default customer newsletter campaign list.', ${orgId}),
      ('ApexWeeklyDigest', 'Weekly executive summaries and updates.', ${orgId})
      ON CONFLICT (name, org_id) DO NOTHING
    `;
  } catch (error) {
    console.error(
      "Failed to seed default mailing lists for org:",
      orgId,
      error,
    );
  }
}

export async function dbGetMailingLists(orgId: string): Promise<MailingList[]> {
  await ensureDefaultMailingLists(orgId);
  const rows = await sql`
    SELECT name, description, status, created_at
    FROM mailing_lists
    WHERE org_id = ${orgId} AND status != 'deleted'
    ORDER BY created_at DESC
  `;
  return rows as MailingList[];
}

/**
 * Create a new mailing list
 */
export async function dbCreateMailingList(
  name: string,
  description: string | undefined,
  orgId: string,
): Promise<MailingList> {
  const rows = await sql`
    INSERT INTO mailing_lists (name, description, org_id, status)
    VALUES (${name}, ${description || null}, ${orgId}, 'active')
    ON CONFLICT (name, org_id) DO UPDATE SET description = EXCLUDED.description, status = 'active'
    RETURNING name, description, status, created_at
  `;
  return rows[0] as MailingList;
}

/**
 * Fetch all clients with their subscription status for a specific list
 */
export async function dbGetMailingListSubscribers(
  listName: string,
  orgId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>
> {
  const rows = await sql`
    SELECT 
      c.id, 
      c.name, 
      c.email, 
      c.phone_number, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM clients c
    LEFT JOIN mailing_list_subscriptions mls ON mls.client_id = c.id AND mls.mailing_list_name = ${listName} AND mls.org_id = ${orgId}
    WHERE c.org_id = ${orgId}
    ORDER BY c.created_at DESC
  `;
  return rows as Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>;
}

/**
 * Update a client's subscription status on a specific mailing list
 */
export async function dbUpdateSubscriptionStatus(
  clientId: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  orgId?: string,
): Promise<boolean> {
  let resolvedOrgId = orgId;
  if (!resolvedOrgId) {
    const clientRows =
      await sql`SELECT org_id FROM clients WHERE id = ${clientId}`;
    if (clientRows.length === 0) return false;
    resolvedOrgId = clientRows[0].org_id;
  }

  if (!resolvedOrgId) return false;

  await ensureDefaultMailingLists(resolvedOrgId);

  await sql`
    INSERT INTO mailing_list_subscriptions (client_id, mailing_list_name, status, org_id)
    VALUES (${clientId}, ${listName}, ${status}, ${resolvedOrgId})
    ON CONFLICT (client_id, mailing_list_name)
    DO UPDATE SET status = EXCLUDED.status
  `;
  return true;
}

/**
 * Update a client's subscription status on a specific mailing list by client email
 */
export async function dbUpdateSubscriptionStatusByEmail(
  email: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  orgId?: string,
): Promise<boolean> {
  const rows = orgId
    ? await sql`SELECT id, org_id FROM clients WHERE email = ${email} AND org_id = ${orgId}`
    : await sql`SELECT id, org_id FROM clients WHERE email = ${email}`;
  if (rows.length === 0) return false;

  await dbUpdateSubscriptionStatus(
    rows[0].id,
    listName,
    status,
    rows[0].org_id,
  );
  return true;
}

/**
 * Fetch a subscriber's list preferences using their client ID (UUID)
 */
export async function dbGetClientSubscriptionsById(id: string) {
  const clientRows = await sql`
    SELECT id, name, email, opt_in_newsletter, org_id
    FROM clients
    WHERE id = ${id}
  `;
  if (clientRows.length === 0) {
    return null;
  }
  const client = clientRows[0];

  const subRows = await sql`
    SELECT 
      ml.name as "listName", 
      ml.description, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM mailing_lists ml
    LEFT JOIN mailing_list_subscriptions mls ON mls.mailing_list_name = ml.name AND mls.client_id = ${client.id} AND mls.org_id = ${client.org_id}
    WHERE ml.org_id = ${client.org_id} AND ml.status = 'active'
    ORDER BY ml.name ASC
  `;

  return {
    client: { id: client.id, name: client.name, email: client.email },
    globalOptIn: client.opt_in_newsletter,
    subscriptions: subRows as Array<{
      listName: string;
      description: string;
      status: "subscribed" | "unsubscribed";
    }>,
  };
}

/**
 * Fetch a subscriber's list preferences using their email
 */
export async function dbGetClientSubscriptionsByEmail(email: string) {
  const clientRows = await sql`
    SELECT id, name, email, opt_in_newsletter, org_id
    FROM clients
    WHERE email = ${email}
  `;
  if (clientRows.length === 0) {
    return null;
  }
  const client = clientRows[0];

  const subRows = await sql`
    SELECT 
      ml.name as "listName", 
      ml.description, 
      COALESCE(mls.status, 'unsubscribed') as status
    FROM mailing_lists ml
    LEFT JOIN mailing_list_subscriptions mls ON mls.mailing_list_name = ml.name AND mls.client_id = ${client.id} AND mls.org_id = ${client.org_id}
    WHERE ml.org_id = ${client.org_id} AND ml.status = 'active'
    ORDER BY ml.name ASC
  `;

  return {
    client: { id: client.id, name: client.name, email: client.email },
    globalOptIn: client.opt_in_newsletter,
    subscriptions: subRows as Array<{
      listName: string;
      description: string;
      status: "subscribed" | "unsubscribed";
    }>,
  };
}

/**
 * Get the total count of mailing lists for an organization
 */
export async function dbGetMailingListsCount(orgId: string): Promise<number> {
  await ensureDefaultMailingLists(orgId);
  const rows = await sql`
    SELECT COUNT(*)::integer as count
    FROM mailing_lists
    WHERE org_id = ${orgId} AND status != 'deleted'
  `;
  return rows[0]?.count || 0;
}

/**
 * Delete a mailing list by updating its status to 'deleted'
 */
export async function dbDeleteMailingList(
  name: string,
  orgId: string,
): Promise<boolean> {
  const result = await sql`
    UPDATE mailing_lists
    SET status = 'deleted'
    WHERE name = ${name} AND org_id = ${orgId}
    RETURNING name
  `;
  return result.length > 0;
}

/**
 * Edit/rename a mailing list in a safe database transaction.
 * Since name is a primary key, it copies the records to a new name,
 * updates foreign references, and deletes the old name.
 */
export async function dbEditMailingList(
  oldName: string,
  newName: string,
  description: string | undefined,
  orgId: string,
): Promise<MailingList> {

  if (oldName === newName) {
    const rows = await sql`
      UPDATE mailing_lists
      SET description = ${description || null}
      WHERE name = ${oldName} AND org_id = ${orgId}
      RETURNING name, description, status, created_at
    `;
    return rows[0] as MailingList;
  }

  // 1. Insert new mailing list entry
  const rows = await sql`
    INSERT INTO mailing_lists (name, description, org_id, status)
    VALUES (${newName}, ${description || null}, ${orgId}, 'active')
    ON CONFLICT (name, org_id) DO UPDATE SET description = EXCLUDED.description, status = 'active'
    RETURNING name, description, status, created_at
  `;

  // 2. Update mailing_list_subscriptions referencing oldName
  await sql`
    UPDATE mailing_list_subscriptions
    SET mailing_list_name = ${newName}
    WHERE mailing_list_name = ${oldName} AND org_id = ${orgId}
  `;

  // 3. Update campaigns referencing oldName
  await sql`
    UPDATE campaigns
    SET mailing_list_name = ${newName}
    WHERE mailing_list_name = ${oldName} AND org_id = ${orgId}
  `;

  // 4. Delete old mailing list
  await sql`
    DELETE FROM mailing_lists
    WHERE name = ${oldName} AND org_id = ${orgId}
  `;

  return rows[0] as MailingList;
}

/**
 * Get count of active subscribers on a specific mailing list
 */
export async function dbGetMailingListSubscribersCount(
  listName: string,
  orgId: string,
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::integer as count
    FROM mailing_list_subscriptions
    WHERE mailing_list_name = ${listName}
      AND org_id = ${orgId}
      AND status = 'subscribed'
  `;
  return rows[0]?.count || 0;
}

/**
 * Get all distinct organization IDs with non-deleted mailing lists
 */
export async function dbGetDistinctOrgsWithMailingLists(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT org_id
    FROM mailing_lists
    WHERE org_id IS NOT NULL AND status != 'deleted'
  `;
  return (rows as Array<{ org_id: string }>).map((r) => r.org_id);
}

/**
 * Rebalance mailing lists status for an organization based on the given limit
 */
export async function dbRebalanceListsForOrg(
  orgId: string,
  limit: number,
): Promise<{ activated: string[]; disabled: string[] }> {
  // First, ensure the oldest "limit" non-deleted lists are active
  const activateResult = await sql`
    UPDATE mailing_lists
    SET status = 'active'
    WHERE org_id = ${orgId}
      AND status = 'disabled'
      AND name IN (
        SELECT name
        FROM mailing_lists
        WHERE org_id = ${orgId}
          AND status != 'deleted'
        ORDER BY created_at ASC
        LIMIT ${limit}
      )
    RETURNING name
  `;

  // Then, disable any excess non-deleted lists beyond the limit
  const disableResult = await sql`
    UPDATE mailing_lists
    SET status = 'disabled'
    WHERE org_id = ${orgId}
      AND status = 'active'
      AND name NOT IN (
        SELECT name
        FROM mailing_lists
        WHERE org_id = ${orgId}
          AND status != 'deleted'
        ORDER BY created_at ASC
        LIMIT ${limit}
      )
    RETURNING name
  `;

  return {
    activated: (activateResult as Array<{ name: string }>).map((r) => r.name),
    disabled: (disableResult as Array<{ name: string }>).map((r) => r.name),
  };
}

/**
 * Rebalance subscribers for a given list of an organization based on the client limit
 */
export async function dbRebalanceSubscribersForList(
  orgId: string,
  listName: string,
  limit: number,
): Promise<string[]> {
  const result = await sql`
    UPDATE mailing_list_subscriptions
    SET status = 'unsubscribed'
    WHERE mailing_list_name = ${listName}
      AND org_id = ${orgId}
      AND status = 'subscribed'
      AND client_id NOT IN (
        SELECT client_id
        FROM mailing_list_subscriptions
        WHERE mailing_list_name = ${listName}
          AND org_id = ${orgId}
          AND status = 'subscribed'
        ORDER BY created_at ASC
        LIMIT ${limit}
      )
    RETURNING client_id
  `;
  return (result as Array<{ client_id: string }>).map((r) => r.client_id);
}

