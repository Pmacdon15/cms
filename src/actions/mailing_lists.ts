"use server";

import {
  dalCreateMailingList,
  dalGetMailingLists,
  dalGetMailingListSubscribers,
  dalGetClientSubscriptionsByEmail,
  dalUpdateSubscriptionStatus,
  dalUpdateGlobalOptIn,
} from "../dal/mailing_lists";

/**
 * Server action to get all mailing lists from AWS SES
 */
export async function actionGetMailingLists() {
  const res = await dalGetMailingLists();
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to create a new mailing list in AWS SES
 */
export async function actionCreateMailingList(name: string, description?: string) {
  const res = await dalCreateMailingList(name, description);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to get subscribers of a specific AWS SES mailing list
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
 * Server action to toggle subscription status on a specific AWS SES list
 */
export async function actionUpdateSubscriptionStatus(
  email: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  isPublic = false
) {
  const res = await dalUpdateSubscriptionStatus(email, listName, status, isPublic);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}

/**
 * Server action to update global newsletter opt-in preference in AWS SES
 */
export async function actionUpdateGlobalOptIn(email: string, optInNewsletter: boolean) {
  const res = await dalUpdateGlobalOptIn(email, optInNewsletter);
  if (res.isOk()) return { ok: true, value: res.value };
  return { ok: false, error: res.error.message };
}
