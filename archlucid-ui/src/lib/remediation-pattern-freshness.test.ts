import { describe, expect, it } from "vitest";

import {
  remediationPatternsDataStaleCue,
  resolveRemediationPatternsLastRefreshedAt,
} from "@/lib/remediation-pattern-freshness";

describe("remediation-pattern-freshness", () => {
  it("uses the newest list or detail refresh timestamp", () => {
    const at = resolveRemediationPatternsLastRefreshedAt({
      listUpdatedAt: 1_000,
      detailUpdatedAt: 5_000,
    });

    expect(at?.getTime()).toBe(5_000);
  });

  it("surfaces a stale cue after five minutes", () => {
    const last = new Date("2026-01-01T12:00:00.000Z");
    const nowMs = last.getTime() + 6 * 60 * 1000;

    expect(remediationPatternsDataStaleCue(last, nowMs)).toMatch(/stale/i);
    expect(remediationPatternsDataStaleCue(last, last.getTime() + 60_000)).toBeNull();
  });
});
