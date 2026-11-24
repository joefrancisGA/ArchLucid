import { act, renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false }),
}));

vi.mock("@/hooks/use-review-detail-last-visited", () => ({
  useReviewDetailLastVisited: () => ({
    isTabNewSinceLastVisit: () => false,
    markTabSeen: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-incremental-review-findings-refresh", () => ({
  useIncrementalReviewFindingsRefresh: vi.fn(),
}));

vi.mock("@/lib/workspace-mode/use-professional-workbench-enabled", () => ({
  useProfessionalWorkbenchEnabled: () => ({
    mounted: false,
    enabled: false,
    setEnabled: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-review-workbench-shortcuts", () => ({
  useReviewWorkbenchShortcuts: vi.fn(),
}));

vi.mock("@/lib/review-detail-section-scroll", () => ({
  scheduleScrollToReviewDetailSection: vi.fn(),
}));

import { useReviewDetailWorkspaceTabs } from "@/components/reviews/use-review-detail-workspace-tabs";
import type { ReviewDetailWorkspaceProps } from "@/components/reviews/ReviewDetailWorkspace";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const baseProps: ReviewDetailWorkspaceProps = {
  runId: "run-abc",
  tabLifecycle: {
    manifestId: "manifest-1",
    showProgressTracker: false,
    runCompleted: true,
  },
  panels: {
    overview: null,
    findings: null,
    evidence: null,
    policies: null,
    decisionsRemediation: null,
    reviewPackage: null,
    architecture: null,
    activity: null,
  },
};

describe("useReviewDetailWorkspaceTabs URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows workbenchFocus query changes without a popstate event", () => {
    const { result, rerender } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.workbenchFocusColumn).toBeNull();

    searchParamsHarness.applyQuery("reviewTab=findings&workbenchFocus=evidence");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&workbenchFocus=evidence",
    );
    rerender();

    expect(result.current.activeTab).toBe("findings");
    expect(result.current.workbenchFocusColumn).toBe("evidence");
  });

  it("follows presenter query changes without a popstate event", () => {
    const { result, rerender } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.presenterMode).toBe(false);

    searchParamsHarness.applyQuery("reviewTab=overview&presenter=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview&presenter=1");
    rerender();

    expect(result.current.presenterMode).toBe(true);

    searchParamsHarness.applyQuery("reviewTab=overview");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
    rerender();

    expect(result.current.presenterMode).toBe(false);
  });

  it("follows reviewTab query changes without a popstate event", () => {
    const { result, rerender } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");

    searchParamsHarness.applyQuery("reviewTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=findings");
    rerender();

    expect(result.current.activeTab).toBe("findings");
  });

  it("hydrates the initial active tab from a findings deep link", () => {
    searchParamsHarness.applyQuery("reviewTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=findings");

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("findings");
  });

  it("switches the active tab when a mounted workspace hash changes tabs", () => {
    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");

    act(() => {
      window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview#run-explanation");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("findings");
  });

  it("restores the query-selected tab when a mounted workspace hash is removed", () => {
    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    act(() => {
      window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview#run-explanation");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("findings");

    act(() => {
      window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("overview");
  });

  it("clears workbench focus on initial load when a section hash selects a non-workbench tab", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&workbenchFocus=findings");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&workbenchFocus=findings#review-summary",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");
    expect(result.current.workbenchFocusColumn).toBeNull();
    expect(window.location.search).not.toContain("workbenchFocus");
    expect(window.location.hash).toBe("#review-summary");
  });

  it("clears workbench focus from the URL on popstate when reviewTab stays on a non-workbench tab", () => {
    searchParamsHarness.applyQuery("reviewTab=overview");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");
    expect(result.current.workbenchFocusColumn).toBeNull();

    act(() => {
      window.history.pushState({}, "", "/architecture/reviews/run-abc?reviewTab=overview&workbenchFocus=findings");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current.activeTab).toBe("overview");
    expect(result.current.workbenchFocusColumn).toBeNull();
    expect(window.location.search).not.toContain("workbenchFocus");
  });
  it("clears workbench focus on initial load when reviewTab is a non-workbench tab", () => {
    searchParamsHarness.applyQuery("reviewTab=overview&workbenchFocus=findings");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=overview&workbenchFocus=findings",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");
    expect(result.current.workbenchFocusColumn).toBeNull();
    expect(window.location.search).not.toContain("workbenchFocus");
  });
  it("clears findingId from the URL when navigating to overview from findings", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-queue-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("findings");

    act(() => {
      result.current.navigateTab("overview");
    });

    expect(result.current.activeTab).toBe("overview");
    expect(window.location.search).not.toContain("findingId=");
  });
  it("clears workbench focus when a section hash moves to a non-workbench tab", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&workbenchFocus=findings");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&workbenchFocus=findings",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("findings");
    expect(result.current.workbenchFocusColumn).toBe("findings");

    act(() => {
      window.history.replaceState(
        {},
        "",
        "/architecture/reviews/run-abc?reviewTab=findings&workbenchFocus=findings#review-summary",
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("overview");
    expect(result.current.workbenchFocusColumn).toBeNull();
    expect(window.location.search).not.toContain("workbenchFocus");
    expect(window.location.hash).toBe("#review-summary");
  });
  it("clears findingId when a section hash moves to a non-findings tab", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-queue-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("findings");

    act(() => {
      window.history.replaceState(
        {},
        "",
        "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1#review-summary",
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("overview");
    expect(window.location.search).not.toContain("findingId=");
    expect(window.location.hash).toBe("#review-summary");
  });
  it("keeps findingId when a section hash stays on findings", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-queue-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    act(() => {
      window.history.replaceState(
        {},
        "",
        "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1#run-explanation",
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTab).toBe("findings");
    expect(window.location.search).toContain("findingId=finding-queue-1");
  });

  it("does not apply visit-default finding navigation when the URL only carries legacy diagramFindingId", () => {
    searchParamsHarness.applyQuery("diagramFindingId=legacy-finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?diagramFindingId=legacy-finding-1");

    const { result } = renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?diagramFindingId=legacy-finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("findingId=");
  });























  it("does not apply visit-default navigation when the URL only carries quickDecisionSecondaryFindingFindingId", () => {
    searchParamsHarness.applyQuery("quickDecisionSecondaryFindingFindingId=finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?quickDecisionSecondaryFindingFindingId=finding-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?quickDecisionSecondaryFindingFindingId=finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runAuditIdentifiersOpen=1", () => {
    searchParamsHarness.applyQuery("runAuditIdentifiersOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runAuditIdentifiersOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runAuditIdentifiersOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runPipelineTimelineOpen=1", () => {
    searchParamsHarness.applyQuery("runPipelineTimelineOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runPipelineTimelineOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runPipelineTimelineOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runRetrievalGroundingOpen=1", () => {
    searchParamsHarness.applyQuery("runRetrievalGroundingOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runRetrievalGroundingOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runRetrievalGroundingOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDetailActivityTechnicalOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailActivityTechnicalOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailActivityTechnicalOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailActivityTechnicalOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDetailActivityOutcomeMetricsOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailActivityOutcomeMetricsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailActivityOutcomeMetricsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailActivityOutcomeMetricsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runPipelineStagesTechnicalOpen=1", () => {
    searchParamsHarness.applyQuery("runPipelineStagesTechnicalOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runPipelineStagesTechnicalOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runPipelineStagesTechnicalOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runToolInvocationForensicsOpen=1", () => {
    searchParamsHarness.applyQuery("runToolInvocationForensicsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runToolInvocationForensicsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runToolInvocationForensicsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries trustEvidenceFieldsOpen=1", () => {
    searchParamsHarness.applyQuery("trustEvidenceFieldsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?trustEvidenceFieldsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?trustEvidenceFieldsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries trustEvidenceTechOpen=1", () => {
    searchParamsHarness.applyQuery("trustEvidenceTechOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?trustEvidenceTechOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?trustEvidenceTechOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runToolInvocationForensicsTraceId", () => {
    searchParamsHarness.applyQuery("runToolInvocationForensicsTraceId=trace-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runToolInvocationForensicsTraceId=trace-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runToolInvocationForensicsTraceId=trace-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runAgentForensicsOpen=1", () => {
    searchParamsHarness.applyQuery("runAgentForensicsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runAgentForensicsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runAgentForensicsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runAgentExecutionLogOpen=1", () => {
    searchParamsHarness.applyQuery("runAgentExecutionLogOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runAgentExecutionLogOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runAgentExecutionLogOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runEngineProvenanceOpen=1", () => {
    searchParamsHarness.applyQuery("runEngineProvenanceOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runEngineProvenanceOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runEngineProvenanceOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runExplanationProvenanceOpen=1", () => {
    searchParamsHarness.applyQuery("runExplanationProvenanceOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runExplanationProvenanceOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runExplanationProvenanceOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runAdvancedAnalysisOpen=1", () => {
    searchParamsHarness.applyQuery("runAdvancedAnalysisOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runAdvancedAnalysisOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runAdvancedAnalysisOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runPipelineStagesOpen=1", () => {
    searchParamsHarness.applyQuery("runPipelineStagesOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runPipelineStagesOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runPipelineStagesOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries changesSinceLastReviewOpen=1", () => {
    searchParamsHarness.applyQuery("changesSinceLastReviewOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?changesSinceLastReviewOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?changesSinceLastReviewOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries pipelineTimelineEventId", () => {
    searchParamsHarness.applyQuery("pipelineTimelineEventId=evt-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?pipelineTimelineEventId=evt-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?pipelineTimelineEventId=evt-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runRefineWithAiOpen=1", () => {
    searchParamsHarness.applyQuery("runRefineWithAiOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runRefineWithAiOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runRefineWithAiOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDeliverablesOpen=1", () => {
    searchParamsHarness.applyQuery("runDeliverablesOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDeliverablesOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDeliverablesOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runTechnicalDetailsOpen=1", () => {
    searchParamsHarness.applyQuery("runTechnicalDetailsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runTechnicalDetailsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runTechnicalDetailsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDetailSponsorBriefingOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailSponsorBriefingOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailSponsorBriefingOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailSponsorBriefingOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDetailProvenanceIdentifiersOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailProvenanceIdentifiersOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailProvenanceIdentifiersOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailProvenanceIdentifiersOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries bulkEvidenceUploadErrorDiagnosticsOpen=1", () => {
    searchParamsHarness.applyQuery("bulkEvidenceUploadErrorDiagnosticsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?bulkEvidenceUploadErrorDiagnosticsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?bulkEvidenceUploadErrorDiagnosticsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runDetailBuyerSponsorBriefExportsOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailBuyerSponsorBriefExportsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailBuyerSponsorBriefExportsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailBuyerSponsorBriefExportsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runDetailFirstScreenProofOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailFirstScreenProofOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailFirstScreenProofOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailFirstScreenProofOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runInspectorRelatedActionsOpen=1", () => {
    searchParamsHarness.applyQuery("runInspectorRelatedActionsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runInspectorRelatedActionsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runInspectorRelatedActionsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runInspectorOpenArtifactOpen=1", () => {
    searchParamsHarness.applyQuery("runInspectorOpenArtifactOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runInspectorOpenArtifactOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runInspectorOpenArtifactOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries reviewPipelineDevTelemetryOpen=1", () => {
    searchParamsHarness.applyQuery("reviewPipelineDevTelemetryOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewPipelineDevTelemetryOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewPipelineDevTelemetryOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runDetailOutcomeCardsOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailOutcomeCardsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailOutcomeCardsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailOutcomeCardsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runDetailOutcomeDecisionKeyOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailOutcomeDecisionKeyOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailOutcomeDecisionKeyOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailOutcomeDecisionKeyOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runDetailOutcomeMonitoredRiskOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailOutcomeMonitoredRiskOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailOutcomeMonitoredRiskOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailOutcomeMonitoredRiskOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries runLastFailureTechOpen=1", () => {
    searchParamsHarness.applyQuery("runLastFailureTechOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runLastFailureTechOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runLastFailureTechOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingEvidenceOpen=1", () => {
    searchParamsHarness.applyQuery("findingEvidenceOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingEvidenceOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingEvidenceOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingAuditOpen=1", () => {
    searchParamsHarness.applyQuery("findingAuditOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingAuditOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingAuditOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingRelatedAuditOpen=1", () => {
    searchParamsHarness.applyQuery("findingRelatedAuditOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingRelatedAuditOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingRelatedAuditOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingTechnicalMetadataOpen=1", () => {
    searchParamsHarness.applyQuery("findingTechnicalMetadataOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingTechnicalMetadataOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingTechnicalMetadataOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingEvidenceBasisOpen=1", () => {
    searchParamsHarness.applyQuery("findingEvidenceBasisOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingEvidenceBasisOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingEvidenceBasisOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingFullEvidenceTraceOpen=1", () => {
    searchParamsHarness.applyQuery("findingFullEvidenceTraceOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingFullEvidenceTraceOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingFullEvidenceTraceOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries findingWorkWithOpen=1", () => {
    searchParamsHarness.applyQuery("findingWorkWithOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?findingWorkWithOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?findingWorkWithOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries quickDecisionSupportingDetailFindingId", () => {
    searchParamsHarness.applyQuery("quickDecisionSupportingDetailFindingId=finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?quickDecisionSupportingDetailFindingId=finding-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?quickDecisionSupportingDetailFindingId=finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries quickDecisionPolicyPackImpactOpen=1", () => {
    searchParamsHarness.applyQuery("quickDecisionPolicyPackImpactOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?quickDecisionPolicyPackImpactOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?quickDecisionPolicyPackImpactOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries muteFindingId", () => {
    searchParamsHarness.applyQuery("muteFindingId=finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?muteFindingId=finding-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?muteFindingId=finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries qdReasonId", () => {
    searchParamsHarness.applyQuery("qdReasonId=finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?qdReasonId=finding-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?qdReasonId=finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries qdAskFindingId", () => {
    searchParamsHarness.applyQuery("qdAskFindingId=finding-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?qdAskFindingId=finding-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?qdAskFindingId=finding-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries showMuted=1", () => {
    searchParamsHarness.applyQuery("showMuted=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?showMuted=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?showMuted=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries terraformExportConfirm=1", () => {
    searchParamsHarness.applyQuery("terraformExportConfirm=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?terraformExportConfirm=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?terraformExportConfirm=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runAssessmentNarrativeOpen=1", () => {
    searchParamsHarness.applyQuery("runAssessmentNarrativeOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runAssessmentNarrativeOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runAssessmentNarrativeOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries transparencyTrailOpen=1", () => {
    searchParamsHarness.applyQuery("transparencyTrailOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?transparencyTrailOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?transparencyTrailOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runDetailStickyActionsTechnicalDetailOpen=1", () => {
    searchParamsHarness.applyQuery("runDetailStickyActionsTechnicalDetailOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runDetailStickyActionsTechnicalDetailOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailStickyActionsTechnicalDetailOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runCoverageCurationOpen=1", () => {
    searchParamsHarness.applyQuery("runCoverageCurationOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runCoverageCurationOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runCoverageCurationOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runFindingExplainabilityOpen=1", () => {
    searchParamsHarness.applyQuery("runFindingExplainabilityOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runFindingExplainabilityOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runFindingExplainabilityOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries runImpactAnalysisOpen=1", () => {
    searchParamsHarness.applyQuery("runImpactAnalysisOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runImpactAnalysisOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runImpactAnalysisOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries techEntryId", () => {
    searchParamsHarness.applyQuery("techEntryId=entry-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?techEntryId=entry-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?techEntryId=entry-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries technologyBaselineEvidenceRefEntryId", () => {
    searchParamsHarness.applyQuery("technologyBaselineEvidenceRefEntryId=entry-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?technologyBaselineEvidenceRefEntryId=entry-1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?technologyBaselineEvidenceRefEntryId=entry-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries workspaceAiProbeDebugMetadataOpen=1", () => {
    searchParamsHarness.applyQuery("workspaceAiProbeDebugMetadataOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?workspaceAiProbeDebugMetadataOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?workspaceAiProbeDebugMetadataOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries workspaceAiProbeDiagnosticsOpen=1", () => {
    searchParamsHarness.applyQuery("workspaceAiProbeDiagnosticsOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?workspaceAiProbeDiagnosticsOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?workspaceAiProbeDiagnosticsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries submittedArchitectureFullDescriptionOpen=1", () => {
    searchParamsHarness.applyQuery("submittedArchitectureFullDescriptionOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?submittedArchitectureFullDescriptionOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?submittedArchitectureFullDescriptionOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries submittedArchitectureOpen=1", () => {
    searchParamsHarness.applyQuery("submittedArchitectureOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?submittedArchitectureOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?submittedArchitectureOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries sponsorRehearsalPreviewOpen=1", () => {
    searchParamsHarness.applyQuery("sponsorRehearsalPreviewOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?sponsorRehearsalPreviewOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?sponsorRehearsalPreviewOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries reviewChainOfCustodySectionKey", () => {
    searchParamsHarness.applyQuery("reviewChainOfCustodySectionKey=who-and-when");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewChainOfCustodySectionKey=who-and-when",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewChainOfCustodySectionKey=who-and-when");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries reviewFailureTechnicalMetadataOpen=1", () => {
    searchParamsHarness.applyQuery("reviewFailureTechnicalMetadataOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewFailureTechnicalMetadataOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewFailureTechnicalMetadataOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries reviewPackageSponsorHandoffMoreExportsOpen=1", () => {
    searchParamsHarness.applyQuery("reviewPackageSponsorHandoffMoreExportsOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewPackageSponsorHandoffMoreExportsOpen=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewPackageSponsorHandoffMoreExportsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries archiveRunId", () => {
    searchParamsHarness.applyQuery("archiveRunId=run-archive-target");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?archiveRunId=run-archive-target");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?archiveRunId=run-archive-target");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries archiveConfirm=1", () => {
    searchParamsHarness.applyQuery("archiveConfirm=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?archiveConfirm=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?archiveConfirm=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries deliverableAudience", () => {
    searchParamsHarness.applyQuery("deliverableAudience=sponsor");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?deliverableAudience=sponsor");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?deliverableAudience=sponsor");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries deliverableOpen=1", () => {
    searchParamsHarness.applyQuery("deliverableOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?deliverableOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?deliverableOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries reviewCliReproduceOpen=1", () => {
    searchParamsHarness.applyQuery("reviewCliReproduceOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewCliReproduceOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewCliReproduceOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries adrOpen=1", () => {
    searchParamsHarness.applyQuery("adrOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?adrOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?adrOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries consultingExportOpen=1", () => {
    searchParamsHarness.applyQuery("consultingExportOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?consultingExportOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?consultingExportOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries finalizeSuccess=1", () => {
    searchParamsHarness.applyQuery("finalizeSuccess=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?finalizeSuccess=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?finalizeSuccess=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries finalizeConfirm=1", () => {
    searchParamsHarness.applyQuery("finalizeConfirm=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?finalizeConfirm=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?finalizeConfirm=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries meetingPacketOpen=1", () => {
    searchParamsHarness.applyQuery("meetingPacketOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?meetingPacketOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?meetingPacketOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries shareLinkOpen=1", () => {
    searchParamsHarness.applyQuery("shareLinkOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?shareLinkOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?shareLinkOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries presenterQuestionId", () => {
    searchParamsHarness.applyQuery("presenterQuestionId=question-iris-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?presenterQuestionId=question-iris-1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?presenterQuestionId=question-iris-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries askThread", () => {
    searchParamsHarness.applyQuery("askThread=thread-resume-1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?askThread=thread-resume-1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?askThread=thread-resume-1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries runDetailWorkspaceDisclosuresExpanded=1", () => {
    searchParamsHarness.applyQuery("runDetailWorkspaceDisclosuresExpanded=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?runDetailWorkspaceDisclosuresExpanded=1",
    );

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runDetailWorkspaceDisclosuresExpanded=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries askDock=1", () => {
    searchParamsHarness.applyQuery("askDock=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?askDock=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?askDock=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries runRecordMetaOpen=1", () => {
    searchParamsHarness.applyQuery("runRecordMetaOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?runRecordMetaOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?runRecordMetaOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries shareMenuOpen=1", () => {
    searchParamsHarness.applyQuery("shareMenuOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?shareMenuOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?shareMenuOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });

  it("does not apply visit-default navigation when the URL only carries pinRunId", () => {
    searchParamsHarness.applyQuery("pinRunId=run-pinned-ctx");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?pinRunId=run-pinned-ctx");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?pinRunId=run-pinned-ctx");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });  it("does not apply visit-default navigation when the URL only carries reviewMoreTabsOpen=1", () => {
    searchParamsHarness.applyQuery("reviewMoreTabsOpen=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewMoreTabsOpen=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?reviewMoreTabsOpen=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries roomElicitation=1", () => {
    searchParamsHarness.applyQuery("roomElicitation=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?roomElicitation=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?roomElicitation=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries legacy archTab", () => {
    searchParamsHarness.applyQuery("archTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?archTab=findings");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?archTab=findings");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries presenter=1", () => {
    searchParamsHarness.applyQuery("presenter=1");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?presenter=1");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?presenter=1");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("does not apply visit-default navigation when the URL only carries workbenchFocus", () => {
    searchParamsHarness.applyQuery("workbenchFocus=evidence");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?workbenchFocus=evidence");

    renderHook(
      () =>
        useReviewDetailWorkspaceTabs({
          ...baseProps,
          visitDefaultReviewTabWhenUrlSilent: "findings",
          visitDefaultFindingIdWhenUrlSilent: "visit-default-finding",
        }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(window.location.search).toBe("?workbenchFocus=evidence");
    expect(window.location.search).not.toContain("visit-default-finding");
    expect(window.location.search).not.toContain("reviewTab=findings");
  });
  it("clears findingId on first paint when a section hash selects overview", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-queue-1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-queue-1#review-summary",
    );

    const { result } = renderHook(() => useReviewDetailWorkspaceTabs(baseProps), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.activeTab).toBe("overview");
    expect(window.location.search).not.toContain("findingId=");
    expect(window.location.hash).toBe("#review-summary");
  });
});