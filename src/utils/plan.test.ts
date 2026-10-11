import { describe, expect, it } from "vitest";
import {
  ALL_PLAN_FEATURES,
  planLimitsFromFeatures,
  planLimitsFromHas,
} from "./plan";

describe("plan limits", () => {
  it("locks everything without the access feature", () => {
    expect(planLimitsFromFeatures(["clients_100"])).toEqual({
      hasAccess: false,
      mailingLists: 0,
      clients: 0,
      sendsPerMonth: 0,
    });
  });

  it("resolves the free plan", () => {
    expect(
      planLimitsFromFeatures([
        "cms_access",
        "mailing_lists_1",
        "clients_50",
        "sends_50_month",
      ]),
    ).toEqual({ hasAccess: true, mailingLists: 1, clients: 50, sendsPerMonth: 50 });
  });

  it("resolves the pro plan, preferring the highest tier", () => {
    const has = ({ feature }: { feature: string }) =>
      ALL_PLAN_FEATURES.includes(feature);
    expect(planLimitsFromHas(has)).toEqual({
      hasAccess: true,
      mailingLists: 10,
      clients: 100,
      sendsPerMonth: 100,
    });
  });

  it("treats a missing has() as no access", () => {
    expect(planLimitsFromHas(undefined).hasAccess).toBe(false);
  });
});
