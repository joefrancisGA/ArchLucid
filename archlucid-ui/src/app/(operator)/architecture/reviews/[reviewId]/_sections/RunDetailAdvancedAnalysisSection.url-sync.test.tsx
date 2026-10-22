import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_ADVANCED_ANALYSIS_OPEN_PARAM } from "@/lib/runs/run-advanced-analysis-disclosure-url";

import { RunDetailAdvancedAnalysisSection } from "./RunDetailAdvancedAnalysisSection";

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

vi.mock("@/components/PostCommitAdvancedAnalysisHint", () => ({
  PostCommitAdvancedAnalysisHint: () => <div data-testid="post-commit-advanced-analysis-hint" />,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("RunDetailAdvancedAnalysisSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runAdvancedAnalysisOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailAdvancedAnalysisSection runId="run-abc" buyerPolishedArtifactTable={false} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByText("Deep dive (technical analysis)").closest("details");
    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_ADVANCED_ANALYSIS_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_ADVANCED_ANALYSIS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailAdvancedAnalysisSection runId="run-abc" buyerPolishedArtifactTable={false} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
