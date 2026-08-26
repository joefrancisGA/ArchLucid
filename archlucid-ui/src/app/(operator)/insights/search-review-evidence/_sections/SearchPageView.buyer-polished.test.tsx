import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
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
import {
  SEARCH_PAGE_SUBTITLE_BUYER,
  SEARCH_PAGE_TITLE,
} from "./search-page-copy";
import { SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE } from "@/lib/search-review-evidence-evidence-copy";

function buildModel(overrides: Partial<SearchPageViewModel> = {}): SearchPageViewModel {
  return {
    buyerShell: true,
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

describe("SearchPageView buyer-polished shell", () => {
  it("uses buyer subtitle, help, and claim orientation strip", () => {
    render(<SearchPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { level: 2, name: SEARCH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SEARCH_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-claim-discipline").textContent).toContain(
      SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("ask-search-evidence-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.getByTestId("search-pick-review-before-search-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("search-review-evidence-form")).not.toBeInTheDocument();
  });
});
