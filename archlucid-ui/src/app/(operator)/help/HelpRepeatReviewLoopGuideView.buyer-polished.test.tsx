import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpRepeatReviewLoopGuideView } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView";
import {
  REPEAT_REVIEW_LOOP_HELP_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE,
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER,
  REPEAT_REVIEW_LOOP_HELP_SCOPE_DETAILS_TRIGGER,
} from "@/lib/repeat-review-loop-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpRepeatReviewLoopGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("repeat-review-loop");

  it("uses buyer subtitle, refresh, action panel, and collapsed overview copy", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByText(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-scope-details")).toBeInTheDocument();
    expect(screen.getByText(REPEAT_REVIEW_LOOP_HELP_SCOPE_DETAILS_TRIGGER)).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-overview")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_OVERVIEW,
    );
    expect(screen.getByTestId("help-repeat-review-loop-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
  });
});
