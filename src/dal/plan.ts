import { auth } from "@clerk/nextjs/server";
import {
  type PlanLimits,
  planLimitsFromHas,
  SIMULATION_LIMITS,
} from "@/utils/plan";

/**
 * Plan limits for the signed-in user's active organization.
 */
export async function getSessionPlanLimits(): Promise<PlanLimits> {
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
  if (!hasClerkKeys) return SIMULATION_LIMITS;
  const { has, orgId } = await auth.protect();
  if (!orgId) return planLimitsFromHas(null);
  return planLimitsFromHas(has);
}

export const NO_PLAN_MESSAGE =
  "Your organization doesn't have an active plan. Choose a plan on the Pricing page to continue.";
