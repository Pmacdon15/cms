import { Result, err, ok } from "neverthrow";
import { checkAuth } from "./auth";
import {
  awsGetMailingLists,
  awsCreateMailingList,
  awsGetMailingListSubscribers,
  awsGetClientSubscriptionsByEmail,
  awsUpdateSubscriptionStatus,
  updateAwsSubscriptionStatus,
} from "../services/aws";
import type { MailingList } from "../types/types";

/**
 * Fetch all mailing lists from AWS SES (Admin authenticated)
 */
export async function dalGetMailingLists(): Promise<Result<MailingList[], Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const lists = await awsGetMailingLists();
    return ok(lists);
  } catch (error: any) {
    console.error("dalGetMailingLists exception:", error);
    return err(new Error(error?.message || "Failed to retrieve mailing lists from AWS."));
  }
}

/**
 * Create a new mailing list in AWS SES (Admin authenticated)
 */
export async function dalCreateMailingList(
  name: string,
  description?: string
): Promise<Result<MailingList, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    if (!name.trim()) {
      return err(new Error("Mailing list name is required."));
    }

    const list = await awsCreateMailingList(name.trim(), description?.trim());
    return ok(list);
  } catch (error: any) {
    console.error("dalCreateMailingList exception:", error);
    return err(new Error(error?.message || "Failed to create mailing list in AWS."));
  }
}

/**
 * Fetch all subscribers on an AWS SES mailing list (Admin authenticated)
 */
export async function dalGetMailingListSubscribers(
  listName: string
): Promise<Result<Array<{ id: string; name: string; email: string; phone_number: string; status: "subscribed" | "unsubscribed" }>, Error>> {
  try {
    const authResult = await checkAuth();
    if (authResult.isErr()) return err(authResult.error);

    const subscribers = await awsGetMailingListSubscribers(listName);
    return ok(subscribers);
  } catch (error: any) {
    console.error("dalGetMailingListSubscribers exception:", error);
    return err(new Error(error?.message || "Failed to retrieve subscribers from AWS."));
  }
}

/**
 * Public resolver to retrieve dynamic mailing list preferences directly from AWS SES (Unauthenticated/Public)
 */
export async function dalGetClientSubscriptionsByEmail(
  email: string
): Promise<Result<{
  client: { name: string; email: string } | null;
  globalOptIn: boolean;
  subscriptions: Array<{ listName: string; description: string; status: "subscribed" | "unsubscribed" }>;
}, Error>> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return err(new Error("Email address is required."));
    }

    // 1. Fetch contact details and subscriptions across all SES Contact Lists
    const sesResult = await awsGetClientSubscriptionsByEmail(cleanEmail);

    // 2. Discover global newsletter opt-in preference (checking DEFAULT_GLOBAL_LIST preference)
    const lists = sesResult.subscriptions;
    const globalList = lists.find((l) => l.listName === "TanStackFormNewsletter");
    const globalOptIn = globalList ? globalList.status === "subscribed" : true;

    return ok({
      client: sesResult.client,
      globalOptIn,
      subscriptions: lists,
    });
  } catch (error: any) {
    console.error("dalGetClientSubscriptionsByEmail exception:", error);
    return err(new Error(error?.message || "Failed to retrieve subscription preferences from AWS."));
  }
}

/**
 * Updates a subscriber's status on a specific AWS SES Contact List
 */
export async function dalUpdateSubscriptionStatus(
  email: string,
  listName: string,
  status: "subscribed" | "unsubscribed",
  isPublic = false
): Promise<Result<boolean, Error>> {
  try {
    // Authenticate if this is not a public unsubscribe form submission
    if (!isPublic) {
      const authResult = await checkAuth();
      if (authResult.isErr()) return err(authResult.error);
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return err(new Error("Email address is required."));
    }

    // Update AWS SES Contact List directly
    const success = await awsUpdateSubscriptionStatus(cleanEmail, listName, status);
    if (!success) {
      return err(new Error(`Failed to update subscription status on AWS SES for ${listName}.`));
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalUpdateSubscriptionStatus exception:", error);
    return err(new Error(error?.message || "Failed to update subscription preference."));
  }
}

/**
 * Updates a subscriber's global newsletter preferences in AWS SES (Unauthenticated/Public)
 */
export async function dalUpdateGlobalOptIn(
  email: string,
  optInNewsletter: boolean
): Promise<Result<boolean, Error>> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return err(new Error("Email address is required."));
    }

    // Update global subscription status in AWS SES
    const success = await updateAwsSubscriptionStatus(cleanEmail, optInNewsletter, true);
    if (!success) {
      return err(new Error("Failed to update global subscription status in AWS SES."));
    }

    // Sync all specific SES lists to match the global toggle
    const sesResult = await awsGetClientSubscriptionsByEmail(cleanEmail);
    const targetStatus = optInNewsletter ? "subscribed" : "unsubscribed";
    
    for (const sub of sesResult.subscriptions) {
      await awsUpdateSubscriptionStatus(cleanEmail, sub.listName, targetStatus);
    }

    return ok(true);
  } catch (error: any) {
    console.error("dalUpdateGlobalOptIn exception:", error);
    return err(new Error(error?.message || "Failed to update global preferences."));
  }
}
