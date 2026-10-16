import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_ACTIVITY_TECHNICAL_OPEN_PARAM } from "@/lib/runs/run-detail-activity-technical-disclosure-url";

import { RunDetailCreateHomeActivityTechnicalDisclosures } from "./RunDetailCreateHomeActivityTechnicalDisclosures";

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
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("RunDetailCreateHomeActivityTechnicalDisclosures URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runDetailActivityTechnicalOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailCreateHomeActivityTechnicalDisclosures
          outcomeCards={<p>Cards</p>}
          midDeferred={<p>Mid</p>}
          sourcesPanel={<p>Sources</p>}
        />
      </SearchParamsRerenderHost>,
    );

    const technicalDetails = () => screen.getByTestId("architecture-activity-technical-detail");
    expect(technicalDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_DETAIL_ACTIVITY_TECHNICAL_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_ACTIVITY_TECHNICAL_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailCreateHomeActivityTechnicalDisclosures
          outcomeCards={<p>Cards</p>}
          midDeferred={<p>Mid</p>}
          sourcesPanel={<p>Sources</p>}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(technicalDetails()).toHaveAttribute("open");
    });
  });
});
