import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM } from "@/lib/runs/run-detail-outcome-cards-disclosure-url";

import { RunDetailDetailedOutcomeCardsDisclosure } from "./RunDetailDetailedOutcomeCardsDisclosure";

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

describe("RunDetailDetailedOutcomeCardsDisclosure URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("writes detailed outcome cards disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailDetailedOutcomeCardsDisclosure>
          <p>Outcome cards</p>
        </RunDetailDetailedOutcomeCardsDisclosure>
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailDetailedOutcomeCardsDisclosure>
          <p>Outcome cards</p>
        </RunDetailDetailedOutcomeCardsDisclosure>
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("Detailed outcome cards"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows runDetailOutcomeCardsOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailDetailedOutcomeCardsDisclosure>
          <p>Outcome cards</p>
        </RunDetailDetailedOutcomeCardsDisclosure>
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByTestId("run-detail-detailed-outcome-cards");
    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailDetailedOutcomeCardsDisclosure>
          <p>Outcome cards</p>
        </RunDetailDetailedOutcomeCardsDisclosure>
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
