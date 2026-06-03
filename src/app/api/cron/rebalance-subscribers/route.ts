import { type NextRequest, NextResponse } from "next/server";
import { dbGetDistinctOrgsWithMailingLists } from "@/db/mailing_lists";
import { dalRebalanceSubscribersForOrg } from "@/dal/mailing_lists";

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
		const orgIds = await dbGetDistinctOrgsWithMailingLists();

		const results: Array<{ orgId: string; listsProcessed: string[] }> = [];

		// 2. Process each organization in parallel or sequence
		for (const orgId of orgIds) {
			const rebalanceResult = await dalRebalanceSubscribersForOrg(orgId);

			const listNames = rebalanceResult.listsProcessed.map((l) => l.listName);
			for (const list of rebalanceResult.listsProcessed) {
				if (list.unsubscribedCount > 0) {
					console.log(
						`[Rebalance-Subscribers] Org ${orgId}, List "${list.listName}": Opted out ${list.unsubscribedCount} excess subscribers (Limit: ${rebalanceResult.clientLimit}).`,
					);
				}
			}

			results.push({ orgId, listsProcessed: listNames });
		}

		return NextResponse.json({ ok: true, processedOrgs: results });
	} catch (error) {
		console.error("[Rebalance-Subscribers] Cron job exception:", error);
		const message = error instanceof Error ? error.message : "Internal error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
