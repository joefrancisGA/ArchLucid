import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_LAST_FAILURE_TECH_OPEN_PARAM } from "@/lib/runs/run-last-failure-tech-details-url";

import { RunDetailLastFailureCard } from "./RunDetailLastFailureCard";

const useReviewPipelineReRunInFlightMock = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/hooks/use-review-pipeline-rerun-in-flight", () => ({
  useReviewPipelineReRunInFlight: useReviewPipelineReRunInFlightMock,
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
  usePathname: () => "/architecture/reviews/r1",
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

const summary = {
  agentType: "Topology",
  failureClass: "timeout",
  triageScenarioId: "timeout",
};

describe("RunDetailLastFailureCard URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    useReviewPipelineReRunInFlightMock.mockReturnValue(false);
    window.history.replaceState({}, "", "/architecture/reviews/r1");
  });

  it("follows runLastFailureTechOpen query changes without a popstate event", async () => {
    const renderCard = () => (
      <SearchParamsRerenderHost>
        <RunDetailLastFailureCard summary={summary} legacyRunStatus="Failed" />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderCard());

    const details = () => screen.getByText("Technical details").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${RUN_LAST_FAILURE_TECH_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/r1?${RUN_LAST_FAILURE_TECH_OPEN_PARAM}=1`,
      );
    });
    rerender(renderCard());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
