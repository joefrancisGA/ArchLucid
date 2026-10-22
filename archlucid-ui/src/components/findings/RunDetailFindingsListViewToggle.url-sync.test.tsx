import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_FINDINGS_LIST_VIEW_PARAM } from "@/lib/findings/review-findings-list-view";

import { RunDetailFindingsListViewToggle } from "./RunDetailFindingsListViewToggle";

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
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("RunDetailFindingsListViewToggle URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1");
  });

  it("follows findingsListView query changes without a popstate event", async () => {
    const renderToggle = () => (
      <SearchParamsRerenderHost>
        <RunDetailFindingsListViewToggle workingMode={true} />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderToggle());

    expect(screen.getByTestId("run-detail-findings-list-view-table")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("run-detail-findings-list-view-cards")).toHaveAttribute("aria-pressed", "false");

    act(() => {
      searchParamsHarness.applyQuery(`${REVIEW_FINDINGS_LIST_VIEW_PARAM}=cards`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1?${REVIEW_FINDINGS_LIST_VIEW_PARAM}=cards`,
      );
    });
    rerender(renderToggle());

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-findings-list-view-cards")).toHaveAttribute("aria-pressed", "true");
    });
  });
});
