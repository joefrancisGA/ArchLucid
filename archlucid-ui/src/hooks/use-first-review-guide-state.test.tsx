import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFirstReviewGuideState } from "./use-first-review-guide-state";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isPending: false, isError: false }),
}));
vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" as const }),
}));
vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));
vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({
    data: {
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: "   ",
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
      sealedReviewRecord: null,
    },
    isSuccess: true,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({ effectiveDoor: null }),
}));
vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => ({
    data: { isConfigured: false, selectedRunId: null },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({ phase: "ready", context: null }),
}));
vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => ({ data: null }),
}));
vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));
vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: () => ({ data: null }),
}));
vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => null,
}));
vi.mock("@/lib/first-review-guide-career-honesty", () => ({
  resolveFirstReviewGuideCareerHonestyContext: () => ({
    evaluationScopeHelper: null,
    hideSampleRecovery: false,
    suppressReadyToFinalize: false,
  }),
}));
vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: () => false,
}));

describe("useFirstReviewGuideState", () => {
  it("does not expose a latest-review link for a blank run id", () => {
    const { result } = renderHook(() => useFirstReviewGuideState());

    expect(result.current.hasLoadedContext).toBe(true);
    expect(result.current.latestRunHref).toBeNull();
  });
});
