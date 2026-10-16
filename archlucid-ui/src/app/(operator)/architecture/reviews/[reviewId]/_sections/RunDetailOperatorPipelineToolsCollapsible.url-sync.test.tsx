import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_REFINE_WITH_AI_OPEN_PARAM } from "@/lib/runs/run-detail-refine-with-ai-disclosure-url";

import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";

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

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAiRefinePanel", () => ({
  RunDetailAiRefinePanel: () => <div data-testid="run-detail-ai-refine-panel" />,
}));

vi.mock("@/components/ai-budget/AiBudgetSpendNotice", () => ({
  AiBudgetSpendNotice: () => <div data-testid="ai-budget-spend-notice" />,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("RunDetailOperatorPipelineToolsCollapsible URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runRefineWithAiOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailOperatorPipelineToolsCollapsible runId="run-abc" />
      </SearchParamsRerenderHost>,
    );

    const refineDetails = () => screen.getByTestId("run-detail-refine-with-ai");
    expect(refineDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_REFINE_WITH_AI_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_REFINE_WITH_AI_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailOperatorPipelineToolsCollapsible runId="run-abc" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(refineDetails()).toHaveAttribute("open");
    });
  });
});
