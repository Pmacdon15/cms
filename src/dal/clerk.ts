import { clerkClient } from "@clerk/nextjs/server";

/**
 * Fetch organization features and public metadata to determine feature limits.
 * Uses parallel requests as demonstrated in Vercel cron example.
 */
export async function getOrgFeatures(orgId: string): Promise<string[]> {
  try {
    const hasClerkKeys = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
    );

    if (!hasClerkKeys) {
      // Simulation mode defaults
      return ["15_mailing_list", "15_campaigns_a_week", "100_clients_per_list"];
    }

    const client = await clerkClient();
    const [org, subscription] = await Promise.all([
      client.organizations.getOrganization({ organizationId: orgId }),
      client.billing
        .getOrganizationBillingSubscription(orgId)
        .catch(() => null),
    ]);

    const metadata = org.publicMetadata as { features?: string[] } | undefined;
    const features = [...(metadata?.features || [])];

    if (subscription) {
      const subscriptionStr = JSON.stringify(subscription).toLowerCase();

      // Map standard clients limits from subscription details
      if (
        subscriptionStr.includes("200_clients") ||
        subscriptionStr.includes("200-clients")
      ) {
        features.push("200_clients_per_list");
      } else if (
        subscriptionStr.includes("100_clients") ||
        subscriptionStr.includes("100-clients")
      ) {
        features.push("100_clients_per_list");
      } else if (
        subscriptionStr.includes("60_clients") ||
        subscriptionStr.includes("60-clients")
      ) {
        features.push("60_clients_per_list");
      } else if (
        subscriptionStr.includes("30_clients") ||
        subscriptionStr.includes("30-clients")
      ) {
        features.push("30_clients_per_list");
      } else if (
        subscriptionStr.includes("15_clients") ||
        subscriptionStr.includes("15-clients")
      ) {
        features.push("15_clients_per_list");
      }

      // Map standard mailing list limits from subscription details
      if (
        subscriptionStr.includes("15_mailing_list") ||
        subscriptionStr.includes("15-mailing-list")
      ) {
        features.push("15_mailing_list");
      } else if (
        subscriptionStr.includes("10_mailing_list") ||
        subscriptionStr.includes("10-mailing-list")
      ) {
        features.push("10_mailing_list");
      } else if (
        subscriptionStr.includes("5_mailing_list") ||
        subscriptionStr.includes("5-mailing-list")
      ) {
        features.push("5_mailing_list");
      }
    }

    return features;
  } catch (error) {
    console.error("Error fetching org features from Clerk:", error);
    return [];
  }
}
