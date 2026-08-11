import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { repeatReviewLoopHelpPageSubtitle } from "@/lib/repeat-review-loop-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/repeat-review-loop",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpRepeatReviewLoopPageHeader } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopPageHeader";

describe("HelpRepeatReviewLoopPageHeader", () => {
  const entry = getProductDocumentationEntry("repeat-review-loop");

  it("renders h1, registry provenance, and export actions without refresh", () => {
    if (entry === undefined) {
      throw new Error("Expected repeat-review-loop documentation entry.");
    }

    render(
      <HelpRepeatReviewLoopPageHeader
        entry={entry}
        subtitle={repeatReviewLoopHelpPageSubtitle(false)}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your repeat architecture review" })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(repeatReviewLoopHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-07-27");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Compare two reviews and Validate review workspace tools",
    );
    expect(screen.queryByTestId("help-repeat-review-loop-refresh-button")).toBeNull();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
  });
});
