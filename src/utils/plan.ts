/**
 * Plan limits, driven entirely by Clerk Billing features.
 *
 * Every limit is its own Clerk feature slug. Attach these in Clerk:
 *   free_org plan: cms_access, mailing_lists_1,  clients_50,  sends_50_month
 *   pro plan:      cms_access, mailing_lists_10, clients_100, sends_100_month
 *
 * An org with none of these features (no plan / no org selected) gets 0 for
 * everything and `hasAccess: false`, which locks the whole app.
 */

export const ACCESS_FEATURE = "cms_access";

export const MAILING_LIST_TIERS = [
  { feature: "mailing_lists_10", limit: 10 },
  { feature: "mailing_lists_1", limit: 1 },
] as const;

export const CLIENT_TIERS = [
  { feature: "clients_100", limit: 100 },
  { feature: "clients_50", limit: 50 },
] as const;

export const SEND_TIERS = [
  { feature: "sends_100_month", limit: 100 },
  { feature: "sends_50_month", limit: 50 },
] as const;

export const ALL_PLAN_FEATURES = [
  ACCESS_FEATURE,
  ...MAILING_LIST_TIERS.map((t) => t.feature),
  ...CLIENT_TIERS.map((t) => t.feature),
  ...SEND_TIERS.map((t) => t.feature),
];

export interface PlanLimits {
  hasAccess: boolean;
  mailingLists: number;
  clients: number;
  sendsPerMonth: number;
}

export type HasFeature = (feature: string) => boolean;

function pickLimit(
  tiers: ReadonlyArray<{ feature: string; limit: number }>,
  hasFeature: HasFeature,
): number {
  return tiers.find((t) => hasFeature(t.feature))?.limit ?? 0;
}

export function resolvePlanLimits(hasFeature: HasFeature): PlanLimits {
  const hasAccess = hasFeature(ACCESS_FEATURE);
  if (!hasAccess) {
    return { hasAccess: false, mailingLists: 0, clients: 0, sendsPerMonth: 0 };
  }
  return {
    hasAccess,
    mailingLists: pickLimit(MAILING_LIST_TIERS, hasFeature),
    clients: pickLimit(CLIENT_TIERS, hasFeature),
    sendsPerMonth: pickLimit(SEND_TIERS, hasFeature),
  };
}

/** For Clerk's `has()` from auth()/useAuth(). */
export function planLimitsFromHas(
  has: ((params: { feature: string }) => boolean) | undefined | null,
): PlanLimits {
  return resolvePlanLimits((feature) => (has ? has({ feature }) : false));
}

/** For a plain list of feature slugs (e.g. webhooks/crons with no session). */
export function planLimitsFromFeatures(features: string[]): PlanLimits {
  const set = new Set(features.map((f) => f.toLowerCase()));
  return resolvePlanLimits((feature) => set.has(feature));
}

/** Limits used when Clerk keys are missing (local simulation mode). */
export const SIMULATION_LIMITS: PlanLimits = {
  hasAccess: true,
  mailingLists: 10,
  clients: 100,
  sendsPerMonth: 100,
};
