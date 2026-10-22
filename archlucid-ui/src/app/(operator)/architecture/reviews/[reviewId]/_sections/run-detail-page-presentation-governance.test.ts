import { describe, expect, it } from "vitest";

import { formatDegradedFindingCoverageBlockedReason } from "@/lib/review-quality/degraded-finding-coverage-blocked-reason";
import { evaluateFinalizeQualityScorecard } from "@/lib/review-quality/finalize-quality-scorecard";
import { deriveFinalizeQualityScorecardInput } from "@/lib/review-quality/finalize-quality-scorecard-from-findings";

import { resolveCommitBlockedReason } from "./run-detail-page-presentation-governance";
import type { RunDetailPageModel } from "./run-detail-page-model";

function model(overrides: {
  readonly buyerPolishedArtifactTable?: boolean;
  readonly degradedFindingCoverage?: boolean;
}): RunDetailPageModel {
  return {
    buyerPolishedArtifactTable: overrides.buyerPolishedArtifactTable ?? false,
    resolvedDetail: {
      degradedFindingCoverage: overrides.degradedFindingCoverage ?? false,
      run: { runId: "run-1" },
    },
  } as RunDetailPageModel;
}

describe("resolveCommitBlockedReason degraded coverage (WS-14)", () => {
  it("does not duplicate degraded coverage — scorecard owns Working-desk WS-14 block", () => {
    const reason = resolveCommitBlockedReason(
      model({ buyerPolishedArtifactTable: false, degradedFindingCoverage: true }),
      {
        failedEngineLabels: ["TopologyEngine/Graph"],
        hasCommitBlockingFailures: false,
      },
    );

    expect(reason).toBeNull();
  });
});

describe("finalize scorecard degraded coverage (WS-14)", () => {
  it("blocks Working finalize when coverage is degraded", () => {
    const scorecard = evaluateFinalizeQualityScorecard(
      deriveFinalizeQualityScorecardInput([], 0, {
        degradedFindingCoverage: true,
        degradedFindingCoverageFailedEngineLabels: ["TopologyEngine/Graph"],
        blockDegradedFindingCoverageOnWorking: true,
      }),
    );

    expect(scorecard.ready).toBe(false);
    expect(scorecard.blockingReasons).toContain(
      formatDegradedFindingCoverageBlockedReason(["TopologyEngine/Graph"]),
    );
  });

  it("keeps Guided/demo advisory-only when Working block flag is off", () => {
    const scorecard = evaluateFinalizeQualityScorecard(
      deriveFinalizeQualityScorecardInput([], 0, {
        degradedFindingCoverage: true,
        degradedFindingCoverageFailedEngineLabels: ["TopologyEngine/Graph"],
        blockDegradedFindingCoverageOnWorking: false,
      }),
    );

    expect(scorecard.ready).toBe(true);
  });
});
