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

    console.log("[Rebalance-List] Starting cron job...");

    // 1. Fetch all distinct org_ids with active/disabled lists
    const orgsRows = await sql`
      SELECT DISTINCT org_id
      FROM mailing_lists
      WHERE org_id IS NOT NULL AND status != 'deleted'
    `;
    const orgIds = orgsRows.map((r) => r.org_id as string);

    const results: Array<{
      orgId: string;
      limit: number;
      activated: number;
      disabled: number;
    }> = [];

    // 2. Process each organization in parallel or sequence
    for (const orgId of orgIds) {
      const features = await getOrgFeatures(orgId);
      let mailingListLimit = 1; // default limit

      if (features.includes("15_mailing_list")) {
        mailingListLimit = 15;
      } else if (features.includes("10_mailing_list")) {
        mailingListLimit = 10;
      } else if (features.includes("5_mailing_list")) {
        mailingListLimit = 5;
      } else {
        mailingListLimit = 1;
      }

      // First, ensure the oldest "mailingListLimit" non-deleted lists are active
      const activateResult = await sql`
        UPDATE mailing_lists
        SET status = 'active'
        WHERE org_id = ${orgId}
          AND status = 'disabled'
          AND name IN (
            SELECT name
            FROM mailing_lists
            WHERE org_id = ${orgId}
              AND status != 'deleted'
            ORDER BY created_at ASC
            LIMIT ${mailingListLimit}
          )
        RETURNING name
      `;

      // Then, disable any excess non-deleted lists beyond the limit
      const disableResult = await sql`
        UPDATE mailing_lists
        SET status = 'disabled'
        WHERE org_id = ${orgId}
          AND status = 'active'
          AND name NOT IN (
            SELECT name
            FROM mailing_lists
            WHERE org_id = ${orgId}
              AND status != 'deleted'
            ORDER BY created_at ASC
            LIMIT ${mailingListLimit}
          )
        RETURNING name
      `;

      if (activateResult.length > 0 || disableResult.length > 0) {
        console.log(
          `[Rebalance-List] Org ${orgId}: Activated ${activateResult.length} lists, Disabled ${disableResult.length} lists (Limit: ${mailingListLimit}).`,
        );
      }

      results.push({
        orgId,
        limit: mailingListLimit,
        activated: activateResult.length,
        disabled: disableResult.length,
      });
    }

    return NextResponse.json({ ok: true, processedOrgs: results });
  } catch (error) {
    console.error("[Rebalance-List] Cron job exception:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
