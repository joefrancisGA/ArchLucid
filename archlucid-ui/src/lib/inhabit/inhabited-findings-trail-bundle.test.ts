import { describe, expect, it } from "vitest";

import { resolveInhabitedFindingsTrailBundleSnapshot } from "@/lib/inhabit/inhabited-findings-trail-bundle";
import type { RunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";

function sampleBundle(
  overrides: Partial<RunDetailCriticalPageBundle> = {},
): RunDetailCriticalPageBundle {
  return {
    buyerSummary: {
      runId: "run-a",
      hasContextSnapshot: false,
      hasGraphSnapshot: false,
      hasFindingsSnapshot: false,
      hasGoldenManifest: false,
    },
    progressSummary: {
      runId: "run-a",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
      enginesSucceeded: 2,
      completedUtc: "2026-09-13T12:00:00.000Z",
    },
    manifestSummary: {
      manifestId: "manifest-a",
      status: "Committed",
      feasibilityVerdict: {
        decision: "Infeasible",
        transparencyTrail: {
          asserted: [{ key: "reason", value: "Budget gap" }],
          inferred: [],
          skipped: [],
        },
      },
    },
    artifacts: [],
    ...overrides,
  };
}

describe("resolveInhabitedFindingsTrailBundleSnapshot (IP-011)", () => {
  it("maps critical-page bundle fields for inhabited first paint", () => {
    const snapshot = resolveInhabitedFindingsTrailBundleSnapshot("run-a", sampleBundle());

    expect(snapshot.runId).toBe("run-a");
    expect(snapshot.trail?.asserted).toHaveLength(1);
    expect(snapshot.feasibilityVerdict?.decision).toBe("Infeasible");
    expect(snapshot.enginesSucceeded).toBe(2);
    expect(snapshot.runCompleted).toBe(true);
  });
});
