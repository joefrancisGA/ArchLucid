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

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
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
    runId: "run-search-1",
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

  it("asks the operator to pick a review before searching", () => {
    render(<SearchPageView model={buildModel({ runId: "" })} />);

    expect(screen.getByTestId("search-pick-review-before-search-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("search-review-evidence-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("search-review-evidence-run-scope-banner")).not.toBeInTheDocument();
  });

  it("shows the search form and checklist when a review is scoped", () => {
    render(<SearchPageView model={buildModel()} />);

    expect(screen.queryByTestId("search-pick-review-before-search-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-form")).toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-run-scope-banner")).toHaveTextContent("run-search-1");
    expect(screen.getByTestId("search-review-evidence-setup-progress")).toBeInTheDocument();
  });
});
