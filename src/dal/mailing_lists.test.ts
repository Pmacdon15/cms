import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  protect: vi.fn(),
  sql: vi.fn(),
  dbGetClientById: vi.fn(),
  dbUpdateClientOptIn: vi.fn(),
  dbGetMailingLists: vi.fn(),
  dbGetMailingListSubscribersCount: vi.fn(),
  dbUpdateSubscriptionStatus: vi.fn(),
  dbUpdateSubscriptionStatusByEmail: vi.fn(),
  getOrgPlanLimits: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect: mocks.protect },
}));
vi.mock("@/db/clerk", () => ({ isOverMemberShipLimit: vi.fn() }));
vi.mock("../db/campaigns", () => ({
  dbGetCampaignsCountThisMonth: vi.fn(),
}));
vi.mock("../db/clients", () => ({
  dbGetClientById: mocks.dbGetClientById,
  dbUpdateClientOptIn: mocks.dbUpdateClientOptIn,
}));
vi.mock("../db/mailing_lists", () => ({
  dbCreateMailingList: vi.fn(),
  dbDeleteMailingList: vi.fn(),
  dbEditMailingList: vi.fn(),
  dbGetClientSubscriptionsById: vi.fn(),
  dbGetMailingListSubscribers: vi.fn(),
  dbGetMailingListSubscribersCount: mocks.dbGetMailingListSubscribersCount,
  dbGetMailingLists: mocks.dbGetMailingLists,
  dbGetMailingListsCount: vi.fn(),
  dbRebalanceListsForOrg: vi.fn(),
  dbRebalanceSubscribersForList: vi.fn(),
  dbUpdateSubscriptionStatus: mocks.dbUpdateSubscriptionStatus,
  dbUpdateSubscriptionStatusByEmail: mocks.dbUpdateSubscriptionStatusByEmail,
}));
vi.mock("../db/neon", () => ({ sql: mocks.sql }));
vi.mock("./clerk", () => ({ getOrgPlanLimits: mocks.getOrgPlanLimits }));
vi.mock("./plan", () => ({
  getSessionPlanLimits: vi.fn(),
  NO_PLAN_MESSAGE: "no plan",
}));

import {
  dalUpdateGlobalOptIn,
  dalUpdateSubscriptionStatus,
  PUBLIC_IDENTIFIER_REQUIRED,
} from "./mailing_lists";

const CLIENT_ID = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";

describe("public subscription preference updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an email identifier on the public list-status path", async () => {
    const result = await dalUpdateSubscriptionStatus(
      "victim@example.com",
      "Newsletter",
      "subscribed",
      true,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().reason).toBe(PUBLIC_IDENTIFIER_REQUIRED);
    expect(mocks.protect).not.toHaveBeenCalled();
    expect(mocks.sql).not.toHaveBeenCalled();
    expect(mocks.dbUpdateSubscriptionStatus).not.toHaveBeenCalled();
    expect(mocks.dbUpdateSubscriptionStatusByEmail).not.toHaveBeenCalled();
  });

  it("still allows the public path with the client UUID", async () => {
    mocks.sql.mockResolvedValue([{ org_id: "org_a" }]);

    const result = await dalUpdateSubscriptionStatus(
      CLIENT_ID,
      "Newsletter",
      "unsubscribed",
      true,
    );

    expect(result.isOk()).toBe(true);
    expect(mocks.dbUpdateSubscriptionStatus).toHaveBeenCalledWith(
      CLIENT_ID,
      "Newsletter",
      "unsubscribed",
      "org_a",
    );
  });

  it("rejects an email identifier on the global opt-in path", async () => {
    const result = await dalUpdateGlobalOptIn("victim@example.com", true);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().reason).toBe(PUBLIC_IDENTIFIER_REQUIRED);
    expect(mocks.dbGetClientById).not.toHaveBeenCalled();
    expect(mocks.dbUpdateClientOptIn).not.toHaveBeenCalled();
  });

  it("updates global opt-in for a client UUID", async () => {
    mocks.dbGetClientById.mockResolvedValue({
      id: CLIENT_ID,
      org_id: "org_a",
      opt_in_sms: false,
    });
    mocks.dbGetMailingLists.mockResolvedValue([{ name: "Newsletter" }]);

    const result = await dalUpdateGlobalOptIn(CLIENT_ID, false);

    expect(result.isOk()).toBe(true);
    expect(mocks.dbUpdateClientOptIn).toHaveBeenCalledWith(
      CLIENT_ID,
      false,
      false,
    );
    expect(mocks.dbUpdateSubscriptionStatus).toHaveBeenCalledWith(
      CLIENT_ID,
      "Newsletter",
      "unsubscribed",
      "org_a",
    );
  });
});
