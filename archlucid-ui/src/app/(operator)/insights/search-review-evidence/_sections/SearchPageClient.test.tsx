import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

import type { SearchPageViewModel } from "./search-page-view-model";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}));

const searchParamsState = { value: "" };
const replaceMock = vi.fn();

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      searchParamsState.value = query;

      for (const listener of listeners) {
        listener();
      }
    },
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: replaceMock,
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(searchParamsState.value),
    usePathname: () => SEARCH_REVIEW_EVIDENCE_PATH,
  };
});

function SearchParamsRerenderHost(props: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsState.value,
    () => "",
  );

  return createElement("div", null, props.children);
}

vi.mock("./SearchPageView", () => ({
  SearchPageView: (props: { model: SearchPageViewModel }) => (
    <button type="button" data-testid="search-set-run-id" onClick={() => props.model.setRunId("run-search-1")}>
      {props.model.runId || "unscoped"}
    </button>
  ),
}));

import { SearchPageClient } from "./SearchPageClient";

describe("SearchPageClient URL-scoped pick", () => {
  beforeEach(() => {
    searchParamsState.value = "";
    replaceMock.mockReset();
    apiGetMock.mockReset();
    apiGetMock.mockResolvedValue([]);
  });

  it("writes the picked review into the search URL", () => {
    render(<SearchPageClient buyerShell={false} isDemo={false} />);

    fireEvent.click(screen.getByTestId("search-set-run-id"));

    expect(replaceMock).toHaveBeenCalledWith(`${SEARCH_REVIEW_EVIDENCE_PATH}?runId=run-search-1`, {
      scroll: false,
    });
  });

  it("passes the URL runId into the search view", () => {
    searchParamsState.value = "runId=run-from-url";

    render(<SearchPageClient buyerShell={false} isDemo={false} />);

    expect(screen.getByTestId("search-set-run-id")).toHaveTextContent("run-from-url");
  });

  it("re-runs retrieval when runId changes but the query string stays the same", async () => {
    searchParamsState.value = "q=shared-query&runId=run-a";

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <SearchPageClient buyerShell={false} isDemo={false} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/v1/retrieval/search?q=shared-query&runId=run-a");
    });

    apiGetMock.mockClear();
    searchParamsHarness.applyQuery("q=shared-query&runId=run-b");
    rerender(
      <SearchParamsRerenderHost>
        <SearchPageClient buyerShell={false} isDemo={false} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/v1/retrieval/search?q=shared-query&runId=run-b");
    });
  });
});
