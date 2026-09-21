import { describe, expect, it } from "vitest";

import {
  remediationFactoryDataStaleCue,
  resolveRemediationFactoryLastRefreshedAt,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-freshness";
import { OPERATOR_HOME_DATA_STALE_THRESHOLD_MS } from "@/lib/operator/operator-last-refreshed-label";

describe("remediation-factory-freshness", () => {
  it("uses the newest query success timestamp across metrics, ranked findings, and paths", () => {
    const refreshedAt = resolveRemediationFactoryLastRefreshedAt({
      metricsUpdatedAt: 1_000,
      rankedUpdatedAt: 5_000,
      rankedPathsUpdatedAt: 3_000,
    });

    expect(refreshedAt?.getTime()).toBe(5_000);
  });

  it("surfaces stale cue when refresh is older than the operator threshold", () => {
    const nowMs = 100_000;
    const lastRefreshedAt = new Date(nowMs - OPERATOR_HOME_DATA_STALE_THRESHOLD_MS - 1);

    expect(remediationFactoryDataStaleCue(lastRefreshedAt, nowMs)).toMatch(/stale/i);
  });
});
