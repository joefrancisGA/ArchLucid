import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  const state = { query: "", windowQuery: null as string | null };

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
    setWindowLocationSearch(query: string): void {
      state.windowQuery = query;
    },
    readWindowLocationSearch(): string {
      return state.windowQuery ?? state.query;
    },
    reset(): void {
      state.query = "";
      state.windowQuery = null;
    },
  };
});

const committedHrefs = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => searchParamsHarness.readWindowLocationSearch(),
    commitHrefIfChanged: (href: string) => {
      committedHrefs.push(href);

      return true;
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
    committedHrefs.length = 0;
    useReviewPipelineReRunInFlightMock.mockReturnValue(false);
    window.history.replaceState({}, "", "/architecture/reviews/r1?staleToolbar=q-old");
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

  it("writes technical details disclosure from useSearchParams when window.location.search lags after soft navigation", () => {
    searchParamsHarness.applyQuery("tab=overview");
    searchParamsHarness.setWindowLocationSearch("tab=overview&staleToolbar=q-old");

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailLastFailureCard summary={summary} legacyRunStatus="Failed" />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("tab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailLastFailureCard summary={summary} legacyRunStatus="Failed" />
      </SearchParamsRerenderHost>,
    );

    const summaryEl = screen.getByText("Technical details");
    fireEvent.click(summaryEl);

    if (committedHrefs.length === 0) {
      const details = summaryEl.closest("details");

      if (details !== null) {
        fireEvent(details, new Event("toggle", { bubbles: true }));
      }
    }

    expect(committedHrefs.length).toBeGreaterThan(0);
    const lastHref = committedHrefs.at(-1) ?? "";
    expect(lastHref).toContain(`${RUN_LAST_FAILURE_TECH_OPEN_PARAM}=`);
    expect(lastHref).toContain("tab=overview");
    expect(lastHref).not.toContain("staleToolbar");
  });
});
