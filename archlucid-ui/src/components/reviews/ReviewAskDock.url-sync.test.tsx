import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

const askStreamMock = vi.hoisted(() => vi.fn(async () => ({ response: null, error: null })));

vi.mock("@/hooks/useAskStream", () => ({
  useAskStream: () => ({
    ask: askStreamMock,
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
    askStreamMock.mockClear();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens ask dock from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-b" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByTestId("review-ask-dock-trigger"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1`,
      );
    });
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
      `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1`,
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

  it("clears ask thread state when askThread is removed from useSearchParams while the dock stays open", async () => {
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

    searchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_ASK_DOCK_OPEN_PARAM}=1`);
    rerender(
      <SearchParamsRerenderHost>
        <ReviewAskDock runId="run-abc" reviewTitle="Claims API" />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByTestId("review-ask-dock-submit"));

    await waitFor(() => {
      expect(askStreamMock).toHaveBeenCalled();
    });

    const lastAskRequest = askStreamMock.mock.calls.at(-1)?.[0] as { runId: string; threadId?: string };

    expect(lastAskRequest.runId).toBe("run-abc");
    expect(lastAskRequest.threadId).toBeUndefined();
  });
});
