import { describe, expect, it } from "vitest";

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
  it("blocks Working finalize when coverage is degraded", () => {
    const reason = resolveCommitBlockedReason(
      model({ buyerPolishedArtifactTable: false, degradedFindingCoverage: true }),
      {
        failedEngineLabels: ["TopologyEngine/Graph"],
        hasCommitBlockingFailures: false,
      },
    );

    expect(reason).toContain("Finding coverage is degraded");
    expect(reason).toContain("TopologyEngine/Graph");
  });

  it("keeps Guided/demo advisory-only when buyer-polished shell is on", () => {
    const reason = resolveCommitBlockedReason(
      model({ buyerPolishedArtifactTable: true, degradedFindingCoverage: true }),
      {
        failedEngineLabels: ["TopologyEngine/Graph"],
        hasCommitBlockingFailures: false,
      },
    );

    expect(reason).toBeNull();
  });
});
