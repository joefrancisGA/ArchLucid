import { fireEvent, render, screen } from "@testing-library/react";
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

  it("renders h1, help, refresh, export actions, and last-refreshed metadata", () => {
    if (entry === undefined) {
      throw new Error("Expected repeat-review-loop documentation entry.");
    }

    const onRefresh = vi.fn();

    render(
      <HelpRepeatReviewLoopPageHeader
        entry={entry}
        subtitle={repeatReviewLoopHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Repeat-review stickiness loop" })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(repeatReviewLoopHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
    expect(screen.getByTestId("help-repeat-review-loop-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("help-repeat-review-loop-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
