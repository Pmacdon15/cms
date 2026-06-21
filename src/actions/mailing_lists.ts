"use server";

import { updateTag } from "next/cache";
import {
  dalCreateMailingList,
  dalDeleteMailingList,
  dalEditMailingList,
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
  return await dalGetMailingLists();
}

/**
 * Server action to create a new mailing list
 */
export async function actionCreateMailingList(
  name: string,
  description?: string,
) {
  const result = await dalCreateMailingList(name, description);
  return result.match(
    (list) => {
      updateTag(`mailing-lists-${list.org_id}`);
      return { ok: true, value: list };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}

/**
 * Server action to get subscribers of a specific mailing list
 */
export async function actionGetMailingListSubscribers(listName: string) {
  return await dalGetMailingListSubscribers(listName);
}

/**
 * Public server action to fetch subscription preferences by subscriber email
 */
export async function actionGetClientSubscriptionsByEmail(email: string) {
  return await dalGetClientSubscriptionsByEmail(email);
}

/**
 * Public server action to fetch subscription preferences securely by client UUID
 */
export async function actionGetClientSubscriptionsById(id: string) {
  return await dalGetClientSubscriptionsById(id);
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
  const result = await dalUpdateSubscriptionStatus(
    clientIdOrEmail,
    listName,
    status,
    isPublic,
  );
  return result.match(
    (val) => {
      const { orgId } = val;
      if (orgId) {
        updateTag(`mailing-lists-${orgId}`);
        updateTag(`clients-${orgId}`);
      }
      return { ok: true, value: val };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}

/**
 * Server action to update global newsletter opt-in preference
 */
export async function actionUpdateGlobalOptIn(
  clientIdOrEmail: string,
  optInNewsletter: boolean,
) {
  const result = await dalUpdateGlobalOptIn(clientIdOrEmail, optInNewsletter);
  return result.match(
    (val) => {
      const { orgId } = val;
      updateTag(`mailing-lists-${orgId}`);
      updateTag(`clients-${orgId}`);
      return { ok: true, value: val };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}

/**
 * Server action to delete a mailing list
 */
export async function actionDeleteMailingList(name: string) {
  const result = await dalDeleteMailingList(name);
  return result.match(
    (val) => {
      const { orgId } = val;
      updateTag(`mailing-lists-${orgId}`);
      return { ok: true, value: val };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}

/**
 * Server action to edit/rename a mailing list
 */
export async function actionEditMailingList(
  oldName: string,
  newName: string,
  description?: string,
) {
  const result = await dalEditMailingList(oldName, newName, description);
  return result.match(
    (list) => {
      updateTag(`mailing-lists-${list.org_id}`);
      return { ok: true, value: list };
    },
    (error) => ({ ok: false, error: error.reason }),
  );
}
