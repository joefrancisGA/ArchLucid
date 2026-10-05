import { act, render, renderHook, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

import {
  ReviewWorkbenchSelectionProvider,
  useReviewWorkbenchSelection,
} from "@/components/reviews/ReviewWorkbenchSelectionContext";
import {
  REVIEW_DETAIL_URL_CHANGED_EVENT,
  writeReviewDetailTabToUrl,
} from "@/lib/review-detail-workspace-tabs";

function SelectionProbe(): React.JSX.Element {
  const selection = useReviewWorkbenchSelection();

  return (
    <div>
      <span data-testid="selected-finding-id">{selection?.selectedFindingId ?? "none"}</span>
      <button
        type="button"
        onClick={() => {
          selection?.setSelectedFindingId(null);
        }}
      >
        Clear finding
      </button>
    </div>
  );
}

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("ReviewWorkbenchSelectionProvider", () => {
  afterEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/");
  });

  it("does not rewrite the URL when replaceState clears findingId and useSearchParams stays stale", () => {
    searchParamsHarness.applyQuery("reviewTab=overview&findingId=stale-missing");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview&findingId=stale-missing");

    const onFindingIdChange = vi.fn();

    render(
      <ReviewWorkbenchSelectionProvider
        initialFindingId="stale-missing"
        onFindingIdChange={(findingId) => {
          onFindingIdChange(findingId);
          writeReviewDetailTabToUrl("overview", { findingId });
        }}
      >
        <SelectionProbe />
      </ReviewWorkbenchSelectionProvider>,
    );

    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("stale-missing");

    act(() => {
      screen.getByRole("button", { name: "Clear finding" }).click();
    });

    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("none");
    expect(onFindingIdChange).toHaveBeenCalledTimes(1);
    expect(onFindingIdChange).toHaveBeenLastCalledWith(null);
    expect(window.location.search).not.toContain("findingId=");

    onFindingIdChange.mockClear();

    act(() => {
      window.dispatchEvent(new Event(REVIEW_DETAIL_URL_CHANGED_EVENT));
    });

    expect(onFindingIdChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("selected-finding-id")).toHaveTextContent("none");
  });

  it("follows findingId query changes without a popstate event", () => {
    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-a");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-a",
    );

    function Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <SearchParamsRerenderHost>
          <ReviewWorkbenchSelectionProvider>{children}</ReviewWorkbenchSelectionProvider>
        </SearchParamsRerenderHost>
      );
    }

    const { result, rerender } = renderHook(
      () => useReviewWorkbenchSelection()?.selectedFindingId ?? null,
      { wrapper: Wrapper },
    );

    expect(result.current).toBe("finding-a");

    searchParamsHarness.applyQuery("reviewTab=findings&findingId=finding-b");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-b",
    );
    rerender();

    expect(result.current).toBe("finding-b");
  });
});
