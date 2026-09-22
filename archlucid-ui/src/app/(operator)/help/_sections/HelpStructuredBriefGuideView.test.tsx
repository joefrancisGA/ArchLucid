import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpStructuredBriefGuideView } from "@/app/(operator)/help/_sections/HelpStructuredBriefGuideView";
import {
  STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS,
  STRUCTURED_BRIEF_HELP_HELP_RETURN,
  STRUCTURED_BRIEF_HELP_PAGE_TITLE,
  STRUCTURED_BRIEF_HELP_RELATED_LINKS,
  STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL,
} from "@/lib/structured-brief-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpStructuredBriefGuideView (HST Phase 2)", () => {
  const entry = getProductDocumentationEntry("structured-brief");

  it("renders breadcrumb, applicability, error recovery, related links, and scroll-spy headings", () => {
    if (entry === undefined) {
      throw new Error("Expected structured-brief documentation entry.");
    }

    render(<HelpStructuredBriefGuideView entry={entry} />);

    expect(screen.getByTestId("help-structured-brief-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Structured brief fields");
    expect(screen.getByTestId("help-structured-brief-page-title")).toHaveTextContent(STRUCTURED_BRIEF_HELP_PAGE_TITLE);
    expect(screen.getByRole("link", { name: STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      "#help-structured-brief-primary-content",
    );
    expect(screen.getByTestId("help-structured-brief-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText(/Before sponsor send/i)).not.toBeInTheDocument();

    for (const heading of STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    expect(screen.getByTestId("help-structured-brief-applicability")).toBeInTheDocument();
    expect(screen.getByTestId("help-structured-brief-error-recovery")).toBeInTheDocument();

    const related = screen.getByTestId("help-structured-brief-related-topics");
    for (const topic of STRUCTURED_BRIEF_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-structured-brief-return-to-help")).toHaveAttribute(
      "href",
      STRUCTURED_BRIEF_HELP_HELP_RETURN.href,
    );
  });
});
