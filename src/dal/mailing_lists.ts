import { auth } from "@clerk/nextjs/server";
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
	dbUpdateSubscriptionStatus,
	dbUpdateSubscriptionStatusByEmail,
} from "../db/mailing_lists";
import { sql } from "../db/neon";
import type { MailingList } from "../types/types";
import { checkAuth } from "./auth";
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
		const authResult = await checkAuth();
		if (authResult.isErr())
			return { ok: false, error: authResult.error.message };
		const { orgId } = authResult.value;
		if (!orgId) {
			return { ok: false, error: "Please select or create an organization." };
		}

		const lists = await dbGetMailingLists(orgId);

		let campaignLimit = 1;
		const hasClerkKeys = !!(
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
			process.env.CLERK_SECRET_KEY
		);
		if (hasClerkKeys) {
			const clerkAuth = await auth();
			const has15 = clerkAuth.has
				? clerkAuth.has({ feature: "15_campaigns_a_week" }) ||
					clerkAuth.has({ feature: "15_campinges_a_week" })
				: false;
			const has10 = clerkAuth.has
				? clerkAuth.has({ feature: "10_campaigns_a_week" }) ||
					clerkAuth.has({ feature: "10_campinges_a_week" })
				: false;
			const has5 = clerkAuth.has
				? clerkAuth.has({ feature: "5_campaigns_a_week" }) ||
					clerkAuth.has({ feature: "5_campinges_a_week" })
				: false;

			if (has15) {
				campaignLimit = 15;
			} else if (has10) {
				campaignLimit = 10;
			} else if (has5) {
				campaignLimit = 5;
			} else {
				campaignLimit = 1;
			}
		}

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

		let mailingListLimit = 1;
		const hasClerkKeys = !!(
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
			process.env.CLERK_SECRET_KEY
		);
		if (hasClerkKeys) {
			const clerkAuth = await auth.protect();
			const has15 = clerkAuth.has ? clerkAuth.has({ feature: "15_mailing_list" }) : false;
			const has10 = clerkAuth.has ? clerkAuth.has({ feature: "10_mailing_list" }) : false;
			const has5 = clerkAuth.has ? clerkAuth.has({ feature: "5_mailing_list" }) : false;

			if (has15) {
				mailingListLimit = 15;
			} else if (has10) {
				mailingListLimit = 10;
			} else if (has5) {
				mailingListLimit = 5;
			} else {
				mailingListLimit = 1;
			}
		}

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

		// Resolve orgId if not provided (e.g. public unsubscribe form)
		let resolvedOrgId = orgId;
		if (!resolvedOrgId) {
			const clientRows = (isUuidString(cleanInput)
				? await sql`SELECT org_id FROM clients WHERE id = ${cleanInput}`
				: await sql`SELECT org_id FROM clients WHERE email = ${cleanInput.toLowerCase()}`) as {
				org_id: string;
			}[];
			if (clientRows.length > 0) {
				resolvedOrgId = clientRows[0].org_id;
			}
		}

		if (resolvedOrgId && status === "subscribed") {
			const hasClerkKeys = !!(
				process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
				process.env.CLERK_SECRET_KEY
			);
			let clientLimit = 1; // Default limit
			if (hasClerkKeys) {
				if (!isPublic) {
					const clerkAuth = await auth();
					const has100 = clerkAuth.has
						? clerkAuth.has({ feature: "100_clients_per_list" }) ||
							clerkAuth.has({ feature: "100_clients_pre_list" })
						: false;
					const has60 = clerkAuth.has
						? clerkAuth.has({ feature: "60_clients_per_list" }) ||
							clerkAuth.has({ feature: "60_clients_pre_list" })
						: false;
					const has30 = clerkAuth.has
						? clerkAuth.has({ feature: "30_clients_per_list" }) ||
							clerkAuth.has({ feature: "30_clients_pre_list" })
						: false;
					const has15 = clerkAuth.has
						? clerkAuth.has({ feature: "15_clients_per_list" }) ||
							clerkAuth.has({ feature: "15_clients_pre_list" })
						: false;

					if (has100) {
						clientLimit = 100;
					} else if (has60) {
						clientLimit = 60;
					} else if (has30) {
						clientLimit = 30;
					} else if (has15) {
						clientLimit = 15;
					} else {
						clientLimit = 1;
					}
				} else {
					const features = await getOrgFeatures(resolvedOrgId);
					const normalizedFeatures = features.map((f) =>
						f.toLowerCase().replace(/-/g, "_"),
					);
					if (normalizedFeatures.some((f) => f.includes("100_client"))) {
						clientLimit = 100;
					} else if (normalizedFeatures.some((f) => f.includes("60_client"))) {
						clientLimit = 60;
					} else if (normalizedFeatures.some((f) => f.includes("30_client"))) {
						clientLimit = 30;
					} else if (normalizedFeatures.some((f) => f.includes("15_client"))) {
						clientLimit = 15;
					} else {
						clientLimit = 1;
					}
				}
			}

			// Check if already subscribed
			const alreadySubscribedRows = isUuidString(cleanInput)
				? await sql`SELECT status FROM mailing_list_subscriptions WHERE client_id = ${cleanInput} AND mailing_list_name = ${listName} AND org_id = ${resolvedOrgId}`
				: await sql`SELECT mls.status FROM mailing_list_subscriptions mls JOIN clients c ON c.id = mls.client_id WHERE c.email = ${cleanInput.toLowerCase()} AND mls.mailing_list_name = ${listName} AND mls.org_id = ${resolvedOrgId}`;
			const isAlreadySubscribed =
				(alreadySubscribedRows as Array<{ status: string }>).length > 0 &&
				(alreadySubscribedRows as Array<{ status: string }>)[0].status === "subscribed";

			if (!isAlreadySubscribed) {
				const currentCount = await dbGetMailingListSubscribersCount(
					listName,
					resolvedOrgId,
				);
				if (currentCount >= clientLimit) {
					// Ensure they are opted out in the database
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

/**
 * Delete a mailing list (sets status = 'deleted')
 */
export async function dalDeleteMailingList(
	name: string,
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
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
