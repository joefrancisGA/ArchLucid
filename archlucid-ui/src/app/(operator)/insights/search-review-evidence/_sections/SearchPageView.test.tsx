import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/runs/RunIdPicker", () => ({
  RunIdPicker: () => <div data-testid="search-review-evidence-run-picker" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("./SearchNextReviewFooterClient", () => ({
  SearchNextReviewFooterClient: () => <div data-testid="search-next-review-footer-stub" />,
}));

import { SearchPageView } from "./SearchPageView";
import type { SearchPageViewModel } from "./search-page-view-model";
import { SEARCH_LOAD_RETRY_LABEL } from "./search-page-copy";

function buildModel(overrides: Partial<SearchPageViewModel> = {}): SearchPageViewModel {
  return {
    buyerShell: false,
    failure: null,
    hasSearched: false,
    isDemo: false,
    loading: false,
    onSearch: vi.fn(),
    query: "PHI boundary",
    recentQueries: [],
    onClearRecentQueries: vi.fn(),
    results: [],
    runId: "",
    setQuery: vi.fn(),
    setRunId: vi.fn(),
    ...overrides,
  };
}

describe("SearchPageView", () => {
  it("runs search when an example query chip is clicked", () => {
    const onSearch = vi.fn().mockResolvedValue(undefined);
    const setQuery = vi.fn();

    render(
      <SearchPageView
        model={buildModel({
          query: "",
          onSearch,
          setQuery,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("search-example-query-chip-finding-title"));

    expect(setQuery).toHaveBeenCalledWith("cross-account access finding");
    expect(onSearch).toHaveBeenCalledWith("cross-account access finding");
  });

  it("runs search when a recent query chip is clicked", () => {
    const onSearch = vi.fn().mockResolvedValue(undefined);
    const setQuery = vi.fn();

    render(
      <SearchPageView
        model={buildModel({
          query: "",
          recentQueries: ["phi risk"],
          onSearch,
          setQuery,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("search-recent-query-chip-phi risk"));

    expect(setQuery).toHaveBeenCalledWith("phi risk");
    expect(onSearch).toHaveBeenCalledWith("phi risk");
  });

  it("shows load failure panel with retry that re-invokes search", () => {
    const onSearch = vi.fn();

    render(
      <SearchPageView
        model={buildModel({
          failure: {
            message: "Search failed",
            problem: null,
            correlationId: "corr-1",
            httpStatus: 503,
            retryAfterSeconds: null,
          },
          onSearch,
        })}
      />,
    );

    expect(screen.getByTestId("search-review-evidence-load-failure")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: SEARCH_LOAD_RETRY_LABEL }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
