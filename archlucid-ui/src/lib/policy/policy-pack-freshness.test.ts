import { describe, expect, it } from "vitest";

import { policyPacksDataStaleCue } from "@/lib/policy/policy-pack-freshness";

describe("policy-pack-freshness", () => {
  it("returns null for fresh timestamps", () => {
    const now = Date.UTC(2026, 6, 9, 12, 0, 0);
    const last = new Date(now - 60_000);

    expect(policyPacksDataStaleCue(last, now)).toBeNull();
  });

  it("returns stale cue after five minutes", () => {
    const now = Date.UTC(2026, 6, 9, 12, 0, 0);
    const last = new Date(now - 6 * 60_000);

    expect(policyPacksDataStaleCue(last, now)).toMatch(/may be stale/i);
  });
});
