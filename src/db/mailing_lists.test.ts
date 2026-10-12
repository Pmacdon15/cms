import { beforeEach, describe, expect, it, vi } from "vitest";

const sql = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ cacheTag: vi.fn() }));
vi.mock("./neon", () => ({ sql }));

import { dbUpdateSubscriptionStatus } from "./mailing_lists";

const CLIENT_ID = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";

function lastQueryText(): string {
  const [strings] = sql.mock.calls[sql.mock.calls.length - 1] as [
    TemplateStringsArray,
    ...unknown[],
  ];
  return strings.join("?").replace(/\s+/g, " ");
}

describe("dbUpdateSubscriptionStatus", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("does nothing without an org", async () => {
    expect(
      await dbUpdateSubscriptionStatus(CLIENT_ID, "List", "subscribed"),
    ).toBe(false);
    expect(sql).not.toHaveBeenCalled();
  });

  it("scopes the upsert to clients and rows owned by the org", async () => {
    sql.mockResolvedValue([{ client_id: CLIENT_ID }]);

    const result = await dbUpdateSubscriptionStatus(
      CLIENT_ID,
      "List",
      "unsubscribed",
      "org_a",
    );

    expect(result).toBe(true);
    const query = lastQueryText();
    expect(query).toContain("FROM clients c WHERE c.id = ? AND c.org_id = ?");
    expect(query).toContain(
      "WHERE mailing_list_subscriptions.org_id = EXCLUDED.org_id",
    );
    expect(sql.mock.calls[0].slice(1)).toEqual([
      "List",
      "unsubscribed",
      CLIENT_ID,
      "org_a",
    ]);
  });

  it("reports failure when the client belongs to another org", async () => {
    sql.mockResolvedValue([]);

    expect(
      await dbUpdateSubscriptionStatus(
        CLIENT_ID,
        "List",
        "subscribed",
        "org_b",
      ),
    ).toBe(false);
  });
});
