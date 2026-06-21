"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import {
  dalCreateClient,
  dalDeleteClient,
  dalGetClients,
  dalSearchClients,
  dalUpdateClient,
  dalUpdateClientOptIn,
} from "../dal/clients";
import { clientInputSchema } from "../types/schemas";
import type { ClientInput } from "../types/types";

/**
 * Server action to fetch all clients safely with optional filters
 */
export async function actionGetClients(params?: {
  search?: string;
  client?: string;
}) {
  const result = await dalGetClients(params);
  return result.match(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to search clients safely for autocomplete
 */
export async function actionSearchClients(query: string) {
  const result = await dalSearchClients(query);
  return result.match(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to create a client safely
 */
export async function actionCreateClient(input: ClientInput) {
  const parsed = clientInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid client input" };
  }
  const result = await dalCreateClient(parsed.data);
  return result.match(
    (client) => {
      updateTag(`clients-${client.org_id}`);
      return { ok: true as const, value: client };
    },
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to update subscriber channel preferences safely
 */
export async function actionUpdateClientOptIn(
  id: string,
  optInNewsletter: boolean,
  optInSms: boolean,
) {
  const result = await dalUpdateClientOptIn(id, optInNewsletter, optInSms);
  return result.match(
    (client) => {
      updateTag(`clients-${client.org_id}`);
      updateTag(`clients-${client.org_id}-id-${client.id}`);
      updateTag(`clients-${client.org_id}-email-${client.email}`);
      return { ok: true as const, value: client };
    },
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to update a client's profile details safely
 */
export async function actionUpdateClient(id: string, input: ClientInput) {
  const parsed = clientInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid client input" };
  }
  const result = await dalUpdateClient(id, parsed.data);
  return result.match(
    (client) => {
      updateTag(`clients-${client.org_id}`);
      updateTag(`clients-${client.org_id}-id-${client.id}`);
      updateTag(`clients-${client.org_id}-email-${client.email}`);
      return { ok: true as const, value: client };
    },
    (error) => ({ ok: false as const, error: error.reason }),
  );
}

/**
 * Server action to delete a client record safely
 */
export async function actionDeleteClient(id: string) {
  const { orgId } = await auth.protect();
  const result = await dalDeleteClient(id);
  return result.match(
    (value) => {
      if (orgId) {
        updateTag(`clients-${orgId}`);
        updateTag(`clients-${orgId}-id-${id}`);
      }
      return { ok: true as const, value };
    },
    (error) => ({ ok: false as const, error: error.reason }),
  );
}
