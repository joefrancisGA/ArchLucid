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