import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssumptionAwareCommitBlockedReason } from "@/hooks/use-assumption-aware-commit-blocked-reason";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

vi.mock("@/hooks/use-finalize-readiness", () => ({
  useFinalizeReadiness: vi.fn(() => ({ readiness: null, loading: true })),
}));

vi.mock("@/hooks/use-review-assumption-acknowledgements", () => ({
  useReviewAssumptionAcknowledgements: vi.fn(() => ({ acknowledgedIds: [] })),
}));

const serverBlocks: FinalizeReadinessBlock[] = [
  {
    layer: "integrity",
    code: "lifecycle_phase_incomplete",
    message: "Authority lifecycle phase incomplete.",
  },
];

describe("useAssumptionAwareCommitBlockedReason", () => {
  it("preserves SSR readiness blocks while the client contract is loading", () => {
    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: "Authority lifecycle phase incomplete.",
        serverFinalizeReadinessBlocks: serverBlocks,
        finalizeAssumptionGateApplies: true,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.readinessLoading).toBe(true);
    expect(result.current.blocks).toEqual(serverBlocks);
    expect(result.current.blockedReason).toBe("Authority lifecycle phase incomplete.");
  });

  it("returns empty blocks for lifecycle coverage blocks that bypass the readiness gate", () => {
    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: "Finding coverage is commit-blocking.",
        serverFinalizeReadinessBlocks: serverBlocks,
        finalizeAssumptionGateApplies: false,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.blocks).toEqual([]);
    expect(result.current.blockedReason).toBe("Finding coverage is commit-blocking.");
  });
});
