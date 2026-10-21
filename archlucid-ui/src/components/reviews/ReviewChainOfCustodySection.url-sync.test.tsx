import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM } from "@/lib/reviews/review-chain-of-custody-section-disclosure-url";

import { ReviewChainOfCustodySection } from "./ReviewChainOfCustodySection";

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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
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

const sampleRun = {
  runId: "run-abc",
  projectId: "project-1",
  createdUtc: "2026-06-16T12:00:00Z",
};

describe("ReviewChainOfCustodySection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-a?reviewTab=findings&q=stale-payment&${REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM}=what-ran`,
    );
  });

  it("writes chain of custody section key from useSearchParams when window.location.search lags after soft navigation", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewChainOfCustodySection run={sampleRun} manifestId={null} triggerSource="ui" />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM}=what-ran`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewChainOfCustodySection run={sampleRun} manifestId={null} triggerSource="ui" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByText("What ran").closest("details")).toHaveAttribute("open");
      expect(screen.getByText("Who and when").closest("details")).not.toHaveAttribute("open");
    });

    fireEvent.click(screen.getByText("Who and when"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM}=who-and-when`,
      );
    });
  });

  it("follows reviewChainOfCustodySectionKey query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewChainOfCustodySection run={sampleRun} manifestId={null} triggerSource="ui" />
      </SearchParamsRerenderHost>,
    );

    const whoAndWhen = () => screen.getByText("Who and when").closest("details");
    const whatRan = () => screen.getByText("What ran").closest("details");
    expect(whoAndWhen()).toHaveAttribute("open");
    expect(whatRan()).toHaveAttribute("open");

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM}=what-ran`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM}=what-ran`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewChainOfCustodySection run={sampleRun} manifestId={null} triggerSource="ui" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(whoAndWhen()).not.toHaveAttribute("open");
      expect(whatRan()).toHaveAttribute("open");
    });
  });
});
