import { describe, expect, it } from "vitest";

import {
  remediationFactoryDataStaleCue,
  remediationFactoryFreshnessLabel,
  resolveRemediationFactoryLastRefreshedAt,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-freshness";
import { OPERATOR_HOME_DATA_STALE_THRESHOLD_MS } from "@/lib/operator/operator-last-refreshed-label";

describe("remediation-factory-freshness", () => {
  it("uses the oldest query success timestamp across all contributing panels", () => {
    const refreshedAt = resolveRemediationFactoryLastRefreshedAt({
      metricsUpdatedAt: 5_000,
      rankedUpdatedAt: 1_000,
      rankedPathsUpdatedAt: 3_000,
      outcomeUpdatedAt: 2_000,
      snapshotsUpdatedAt: 4_000,
    });

    expect(refreshedAt?.getTime()).toBe(1_000);
  });

  it("preserves the prior timestamp while refreshing", () => {
    const lastRefreshedAt = new Date(2_000);

    expect(
      remediationFactoryFreshnessLabel({
        lastRefreshedAt,
        refreshing: true,
      }),
    ).toContain("Last refreshed");
    expect(
      remediationFactoryFreshnessLabel({
        lastRefreshedAt,
        refreshing: true,
      }),
    ).toContain("Refreshing remediation factory data");
  });

  it("surfaces stale cue when refresh is older than the operator threshold", () => {
    const nowMs = 100_000;
    const lastRefreshedAt = new Date(nowMs - OPERATOR_HOME_DATA_STALE_THRESHOLD_MS - 1);

    expect(remediationFactoryDataStaleCue(lastRefreshedAt, nowMs)).toMatch(/stale/i);
  });
});
