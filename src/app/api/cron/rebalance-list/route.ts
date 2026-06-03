import { type NextRequest, NextResponse } from "next/server";
import { dbGetDistinctOrgsWithMailingLists } from "@/db/mailing_lists";
import { dalRebalanceListsForOrg } from "@/dal/mailing_lists";

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

		console.log("[Rebalance-List] Starting cron job...");

		// 1. Fetch all distinct org_ids with active/disabled lists
		const orgIds = await dbGetDistinctOrgsWithMailingLists();

		const results: Array<{
			orgId: string;
			limit: number;
			activated: number;
			disabled: number;
		}> = [];

		// 2. Process each organization in parallel or sequence
		for (const orgId of orgIds) {
			const rebalanceResult = await dalRebalanceListsForOrg(orgId);

			if (rebalanceResult.activated.length > 0 || rebalanceResult.disabled.length > 0) {
				console.log(
					`[Rebalance-List] Org ${orgId}: Activated ${rebalanceResult.activated.length} lists, Disabled ${rebalanceResult.disabled.length} lists (Limit: ${rebalanceResult.limit}).`,
				);
			}

			results.push({
				orgId,
				limit: rebalanceResult.limit,
				activated: rebalanceResult.activated.length,
				disabled: rebalanceResult.disabled.length,
			});
		}

		return NextResponse.json({ ok: true, processedOrgs: results });
	} catch (error) {
		console.error("[Rebalance-List] Cron job exception:", error);
		const message = error instanceof Error ? error.message : "Internal error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
