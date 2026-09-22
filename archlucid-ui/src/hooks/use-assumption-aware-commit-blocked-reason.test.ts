import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAssumptionAwareCommitBlockedReason } from "@/hooks/use-assumption-aware-commit-blocked-reason";
import type { FinalizeReadinessBlock, FinalizeReadinessResult } from "@/types/finalize-readiness";

const mockUseFinalizeReadiness = vi.fn(() => ({ readiness: null as FinalizeReadinessResult | null, loading: true }));

vi.mock("@/hooks/use-finalize-readiness", () => ({
  useFinalizeReadiness: (...args: unknown[]) => mockUseFinalizeReadiness(...args),
}));

vi.mock("@/hooks/use-review-assumption-acknowledgements", () => ({
  useReviewAssumptionAcknowledgements: vi.fn(() => ({ acknowledgedIds: new Set<string>() })),
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
    mockUseFinalizeReadiness.mockReturnValue({ readiness: null, loading: true });

    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: "Authority lifecycle phase incomplete.",
        serverFinalizeReadinessBlocks: serverBlocks,
        finalizeReadinessEnabled: true,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.readinessLoading).toBe(true);
    expect(result.current.blocks).toEqual(serverBlocks);
    expect(result.current.blockedReason).toBe("Authority lifecycle phase incomplete.");
  });

  it("uses unified readiness blocks even when legacy lifecycle copy is present on SSR", () => {
    const readiness: FinalizeReadinessResult = {
      runId: "run-1",
      readyToFinalize: false,
      blockedReasonSummary: "Commit blocked: authority lifecycle phase is InProgress; pipeline must be Complete before seal.",
      blocks: serverBlocks,
      checklist: {
        runId: "run-1",
        readyToFinalize: false,
        items: [],
        advisoryCount: 0,
        blockingCount: 1,
        preCommitGateEnabled: true,
      },
      scorecard: {
        blockingFindingCount: 0,
        uncoveredMandatoryRequirementCount: 0,
        openDeferredCount: 0,
        openContradictionCount: 0,
        openCannotDetermineCount: 0,
        openVerifyHypothesisCount: 0,
        unverifiedAssumptionCount: 0,
        lowExtractionConfidenceCount: 0,
        unresolvedHighSeverityDispositionCount: 0,
      },
      scorecardBlockingReasons: [],
      finalizeQualityGateEnabled: true,
    };

    mockUseFinalizeReadiness.mockReturnValue({ readiness, loading: false });

    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: "Legacy lifecycle copy from run summary.",
        serverFinalizeReadinessBlocks: serverBlocks,
        finalizeReadinessEnabled: true,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.blocks).toEqual(serverBlocks);
    expect(result.current.blockedReason).toBe(readiness.blockedReasonSummary);
    expect(result.current.readinessUnavailable).toBe(false);
  });

  it("falls back to legacy blocked reason when readiness is unavailable", () => {
    mockUseFinalizeReadiness.mockReturnValue({ readiness: null, loading: false });

    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: "Finding coverage is commit-blocking.",
        serverFinalizeReadinessBlocks: serverBlocks,
        finalizeReadinessEnabled: true,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.blocks).toEqual(serverBlocks);
    expect(result.current.blockedReason).toBe("Finding coverage is commit-blocking.");
    expect(result.current.readinessUnavailable).toBe(false);
  });

  it("does not fetch readiness when the review is already finalized", () => {
    mockUseFinalizeReadiness.mockReturnValue({ readiness: null, loading: false });

    const { result } = renderHook(() =>
      useAssumptionAwareCommitBlockedReason({
        runId: "run-1",
        serverCommitBlockedReason: null,
        serverFinalizeReadinessBlocks: [],
        finalizeReadinessEnabled: false,
        findings: [],
        blockingFindingCount: 0,
        requestAssumptionTexts: [],
      }),
    );

    expect(result.current.blocks).toEqual([]);
    expect(result.current.blockedReason).toBeNull();
    expect(mockUseFinalizeReadiness).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
