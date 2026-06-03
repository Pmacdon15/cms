"use server";

import {
  dalCreateClient,
  dalDeleteClient,
  dalGetClients,
  dalSearchClients,
  dalUpdateClientOptIn,
} from "../dal/clients";
import type { ClientInput } from "../types/types";

/**
 * Server action to fetch all clients safely with optional filters
 */
export async function actionGetClients(params?: { search?: string; client?: string }) {
  const result = await dalGetClients(params);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Server action to search clients safely for autocomplete
 */
export async function actionSearchClients(query: string) {
  const result = await dalSearchClients(query);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Server action to create a client safely
 */
export async function actionCreateClient(input: ClientInput) {
  const result = await dalCreateClient(input);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
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
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Server action to delete a client record safely
 */
export async function actionDeleteClient(id: string) {
  const result = await dalDeleteClient(id);
  if (result.isOk()) {
    return { ok: true, value: result.value };
  }
  return { ok: false, error: result.error.message };
}
