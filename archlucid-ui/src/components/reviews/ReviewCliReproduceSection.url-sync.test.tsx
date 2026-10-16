import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_CLI_REPRODUCE_OPEN_PARAM } from "@/lib/reviews/review-cli-reproduce-disclosure-url";

import { ReviewCliReproduceSection } from "./ReviewCliReproduceSection";

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

describe("ReviewCliReproduceSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows reviewCliReproduceOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewCliReproduceSection runId="run-abc" />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByText("Reproduce via CLI").closest("details");
    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_CLI_REPRODUCE_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${REVIEW_CLI_REPRODUCE_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewCliReproduceSection runId="run-abc" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
