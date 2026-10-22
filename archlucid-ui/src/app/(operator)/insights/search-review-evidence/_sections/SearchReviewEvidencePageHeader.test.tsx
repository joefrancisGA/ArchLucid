import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/search-review-evidence",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SearchReviewEvidencePageHeader } from "./SearchReviewEvidencePageHeader";
import {
  SEARCH_PAGE_SUBTITLE_BUYER,
  SEARCH_PAGE_TITLE,
} from "./search-page-copy";

describe("SearchReviewEvidencePageHeader", () => {
  it("renders h2, breadcrumb, help, and subtitle", () => {
    render(
      <SearchReviewEvidencePageHeader title={SEARCH_PAGE_TITLE} subtitle={SEARCH_PAGE_SUBTITLE_BUYER} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: SEARCH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SEARCH_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-breadcrumb")).toBeInTheDocument();
  });
});
