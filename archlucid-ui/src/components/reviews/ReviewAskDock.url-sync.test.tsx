import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewAskDock } from "@/components/reviews/ReviewAskDock";
import {
  REVIEW_ASK_DOCK_OPEN_PARAM,
  REVIEW_ASK_DOCK_THREAD_PARAM,
} from "@/lib/reviews/review-ask-dock-url";

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

vi.mock("@/hooks/useAskStream", () => ({
  useAskStream: () => ({
    ask: vi.fn(),
    isStreaming: false,
    tokens: "",
    reset: vi.fn(),
  }),
}));

vi.mock("@/components/ask/AskRunCoverageHonestyStrip", () => ({
  AskRunCoverageHonestyStrip: () => <div data-testid="ask-run-coverage-honesty-strip" />,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("ReviewAskDock URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows askDock query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-abc" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByTestId("review-ask-dock-panel")).not.toBeInTheDocument();

    searchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-abc" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("review-ask-dock-panel")).toBeInTheDocument();
    });
  });

  it("follows askThread query changes without a popstate event when dock is open", async () => {
    const threadQuery = `reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1&${REVIEW_ASK_DOCK_THREAD_PARAM}=thread-soft-nav`;
    searchParamsHarness.applyQuery(threadQuery);
    window.history.replaceState({}, "", `/architecture/reviews/run-abc?${threadQuery}`);

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-abc" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("review-ask-dock-panel")).toBeInTheDocument();
    });

    const nextThreadQuery = `reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1&${REVIEW_ASK_DOCK_THREAD_PARAM}=thread-after-soft-nav`;
    searchParamsHarness.applyQuery(nextThreadQuery);
    window.history.replaceState({}, "", `/architecture/reviews/run-abc?${nextThreadQuery}`);
    rerender(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-abc" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(window.location.search).toContain(`${REVIEW_ASK_DOCK_THREAD_PARAM}=thread-after-soft-nav`);
    });
  });
});
