import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

import type { SearchPageViewModel } from "./search-page-view-model";

const searchParamsState = { value: "" };
const replaceMock = vi.fn();

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
  };
});

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
});
