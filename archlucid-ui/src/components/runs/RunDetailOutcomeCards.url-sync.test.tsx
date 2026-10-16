import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_OUTCOME_DECISION_KEY_OPEN_PARAM } from "@/lib/runs/run-detail-outcome-decision-key-disclosure-url";

import { RunDetailOutcomeCards } from "./RunDetailOutcomeCards";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
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

const baseProps = {
  runId: "run-1",
  hasGoldenManifest: true,
  findingCountDisplay: 1,
  warningCountDisplay: 0,
  artifactCount: 2,
  unresolvedIssueCountDisplay: 0,
};

describe("RunDetailOutcomeCards URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1");
  });

  it("follows runDetailOutcomeDecisionKeyOpen query changes without a popstate event", async () => {
    const renderCards = () => (
      <SearchParamsRerenderHost>
        <RunDetailOutcomeCards {...baseProps} />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderCards());

    const details = () => screen.getByText("Decision key").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${RUN_DETAIL_OUTCOME_DECISION_KEY_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1?${RUN_DETAIL_OUTCOME_DECISION_KEY_OPEN_PARAM}=1`,
      );
    });
    rerender(renderCards());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
