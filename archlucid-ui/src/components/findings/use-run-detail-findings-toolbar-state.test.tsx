import { act, renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathnameHarness = vi.hoisted(() => ({
  value: "/architecture/reviews/run-1",
}));

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

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
      state.query = "";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameHarness.value,
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

import { useRunDetailFindingsToolbarState } from "@/components/findings/use-run-detail-findings-toolbar-state";
import { REVIEW_FINDINGS_JOB_VIEW_PARAM } from "@/lib/findings/review-findings-job-view-url";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useRunDetailFindingsToolbarState", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
  });

  afterEach(() => {
    pathnameHarness.value = "/architecture/reviews/run-1";
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/");
    vi.useRealTimers();
  });

  it("follows findingJobView query changes without a popstate event", () => {
    searchParamsHarness.applyQuery("reviewTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    const { result, rerender } = renderHook(() => useRunDetailFindingsToolbarState(), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.jobView).toBe("needs-my-decision");

    searchParamsHarness.applyQuery(
      `reviewTab=findings&${REVIEW_FINDINGS_JOB_VIEW_PARAM}=verify-hypotheses`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-1?reviewTab=findings&${REVIEW_FINDINGS_JOB_VIEW_PARAM}=verify-hypotheses`,
    );
    rerender();

    expect(result.current.jobView).toBe("verify-hypotheses");
  });

  it("does not publish the previous review toolbar onto the next review URL", () => {
    vi.useFakeTimers();
    searchParamsHarness.applyQuery("reviewTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    const { result, rerender } = renderHook(() => useRunDetailFindingsToolbarState());

    act(() => {
      result.current.setSearchQuery("payment");
      result.current.setOwnerFilter("alex");
      result.current.setFilter("high");
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(window.location.pathname).toBe("/architecture/reviews/run-1");
    expect(window.location.search).toContain("q=payment");
    expect(window.location.search).toContain("owner=alex");

    searchParamsHarness.applyQuery("reviewTab=findings");
    window.history.replaceState({}, "", "/architecture/reviews/run-2?reviewTab=findings");
    pathnameHarness.value = "/architecture/reviews/run-2";
    rerender();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(window.location.pathname).toBe("/architecture/reviews/run-2");
    expect(window.location.search).not.toContain("q=payment");
    expect(window.location.search).not.toContain("owner=alex");
    expect(result.current.filter).toBe("all");
    expect(result.current.searchQuery).toBe("");
    expect(result.current.ownerFilter).toBe("");
  });
});
