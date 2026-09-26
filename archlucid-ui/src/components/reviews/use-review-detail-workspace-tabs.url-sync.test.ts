import { renderHook, type ReactNode } from "@testing-library/react";
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
});
