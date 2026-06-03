import { type NextRequest, NextResponse } from "next/server";
import { getOrgFeatures } from "@/dal/clerk";
import { sql } from "@/db/neon";

export const revalidate = 0;

export async function GET(req: NextRequest) {
	try {
		// Verify cron authorization header
		const isDev = process.env.NODE_ENV === "development";
		if (!isDev && process.env.CRON_SECRET) {
			const authHeader = req.headers.get("authorization");
			if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
		}

		console.log("[Rebalance-Subscribers] Starting cron job...");

		// 1. Fetch all distinct org_ids with active/disabled lists
		const orgsRows = (await sql`
      SELECT DISTINCT org_id
      FROM mailing_lists
      WHERE org_id IS NOT NULL AND status != 'deleted'
    `) as Array<{ org_id: string }>;
		const orgIds = orgsRows.map((r) => r.org_id);

		const results: Array<{ orgId: string; listsProcessed: string[] }> = [];

		// 2. Process each organization in parallel or sequence
		for (const orgId of orgIds) {
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

			// Fetch all active/disabled lists for this org
			const listsRows = (await sql`
        SELECT name
        FROM mailing_lists
        WHERE org_id = ${orgId} AND status != 'deleted'
      `) as Array<{ name: string }>;
			const processed: string[] = [];

			for (const listRow of listsRows) {
				const listName = listRow.name as string;

				// Perform single query to set excess subscribers to 'unsubscribed'
				const result = (await sql`
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
              LIMIT ${clientLimit}
            )
          RETURNING client_id
        `) as Array<{ client_id: string }>;

				if (result.length > 0) {
					console.log(
						`[Rebalance-Subscribers] Org ${orgId}, List "${listName}": Opted out ${result.length} excess subscribers (Limit: ${clientLimit}).`,
					);
				}
				processed.push(listName);
			}

			results.push({ orgId, listsProcessed: processed });
		}

		return NextResponse.json({ ok: true, processedOrgs: results });
	} catch (error) {
		console.error("[Rebalance-Subscribers] Cron job exception:", error);
		const message = error instanceof Error ? error.message : "Internal error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
