import { describe, expect, it } from "vitest";

import { buildPolicyPackSimulationSummary } from "@/lib/policy/policy-pack-dry-run-summary";
import type { PolicyPackDryRunResponse } from "@/types/policy-pack-dry-run";

describe("buildPolicyPackSimulationSummary", () => {
  it("returns HOLD when dry-run would block reviews", () => {
    const result: PolicyPackDryRunResponse = {
      deltaCounts: { evaluated: 2, wouldBlock: 1, wouldAllow: 1, runMissing: 0 },
      items: [],
      page: 1,
      pageSize: 20,
      returnedRuns: 2,
      totalRequestedRuns: 2,
      proposedThresholds: {},
    };

    const summary = buildPolicyPackSimulationSummary(result);

    expect(summary?.disposition).toBe("HOLD");
    expect(summary?.headline).toContain("block");
  });

  it("does not invent zero evaluated reviews when deltaCounts is omitted", () => {
    const result = {
      items: [],
      page: 1,
      pageSize: 20,
      returnedRuns: 0,
      totalRequestedRuns: 0,
      proposedThresholds: {},
    } as PolicyPackDryRunResponse;

    const summary = buildPolicyPackSimulationSummary(result);

    expect(summary?.headline).toContain("not returned");
    expect(summary?.detail).not.toContain("Evaluated 0");
  });
});
