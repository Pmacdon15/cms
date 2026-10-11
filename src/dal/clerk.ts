import { clerkClient } from "@clerk/nextjs/server";
import {
  ALL_PLAN_FEATURES,
  type PlanLimits,
  planLimitsFromFeatures,
  SIMULATION_LIMITS,
} from "@/utils/plan";

const FREE_PLAN_FEATURES = [
  "cms_access",
  "mailing_lists_1",
  "clients_50",
  "sends_50_month",
];

/**
 * Resolve an org's plan feature slugs without a user session
 * (webhooks, crons, public unsubscribe page).
 */
export async function getOrgFeatures(orgId: string): Promise<string[]> {
  try {
    const client = await clerkClient();
    const subscription = await client.billing
      .getOrganizationBillingSubscription(orgId)
      .catch(() => null);

    if (!subscription) return FREE_PLAN_FEATURES;

    // Only look at items that are currently active, then collect any of our
    // known feature slugs attached to those plans.
    const items = (
      (subscription as { subscriptionItems?: Array<{ status?: string }> })
        .subscriptionItems ?? []
    ).filter((item) => !item.status || item.status === "active");

    const haystack = JSON.stringify(items.length ? items : subscription);
    const features = ALL_PLAN_FEATURES.filter((slug) =>
      haystack.includes(`"${slug}"`),
    );

    return features.length ? features : FREE_PLAN_FEATURES;
  } catch (error) {
    console.error("Error fetching org features from Clerk:", error);
    return FREE_PLAN_FEATURES;
  }
}

export async function getOrgPlanLimits(orgId: string): Promise<PlanLimits> {
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
  if (!hasClerkKeys) return SIMULATION_LIMITS;
  return planLimitsFromFeatures(await getOrgFeatures(orgId));
}
