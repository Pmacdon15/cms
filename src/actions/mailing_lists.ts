"use server";

import {
  dalCreateMailingList,
  dalGetClientSubscriptionsByEmail,
  dalGetClientSubscriptionsById,
  dalGetMailingListSubscribers,
  dalGetMailingLists,
  dalUpdateGlobalOptIn,
  dalUpdateSubscriptionStatus,
} from "../dal/mailing_lists";

/**
 * Server action to get all mailing lists
 */
export async function actionGetMailingLists() {
  const res = await dalGetMailingLists();
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to create a new mailing list
 */
export async function actionCreateMailingList(
  name: string,
  description?: string,
) {
  const res = await dalCreateMailingList(name, description);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to get subscribers of a specific mailing list
 */
export async function actionGetMailingListSubscribers(listName: string) {
  const res = await dalGetMailingListSubscribers(listName);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Public server action to fetch subscription preferences by subscriber email
 */
export async function actionGetClientSubscriptionsByEmail(email: string) {
  const res = await dalGetClientSubscriptionsByEmail(email);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Public server action to fetch subscription preferences securely by client UUID
 */
export async function actionGetClientSubscriptionsById(id: string) {
  const res = await dalGetClientSubscriptionsById(id);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to toggle subscription status on a specific list
 */
export async function actionUpdateSubscriptionStatus(
  clientIdOrEmail: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  isPublic = false,
) {
  const res = await dalUpdateSubscriptionStatus(
    clientIdOrEmail,
    listName,
    status,
    isPublic,
  );
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to update global newsletter opt-in preference
 */
export async function actionUpdateGlobalOptIn(
  clientIdOrEmail: string,
  optInNewsletter: boolean,
) {
  const res = await dalUpdateGlobalOptIn(clientIdOrEmail, optInNewsletter);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}
