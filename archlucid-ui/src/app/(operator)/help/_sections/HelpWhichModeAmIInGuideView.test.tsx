import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWhichModeAmIInGuideView } from "@/app/(operator)/help/_sections/HelpWhichModeAmIInGuideView";
import {
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_DEMO,
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_GUIDED,
  MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_WORKING,
  MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE,
  MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS,
  MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN,
  MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS,
  MODE_GRAVITY_HELP_WHICH_MODE_TITLE,
  MODE_GRAVITY_HELP_WHICH_MODE_TOPIC_LABEL,
} from "@/lib/mode-gravity-help-which-mode-guide-content";
import {
  MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_TEST_ID,
  MODE_GRAVITY_HELP_WHICH_MODE_SKIP_LINK_LABEL,
  MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID,
} from "@/lib/mode-gravity-help-which-mode-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWhichModeAmIInGuideView (MG-012 / HEH Phase 2)", () => {
  const entry = getProductDocumentationEntry("which-mode-am-i-in");

  it("renders breadcrumb, provenance, skip link, mode sections, headings, and related links without honesty panel", () => {
    if (entry === undefined) {
      throw new Error("Expected which-mode-am-i-in documentation entry.");
    }

    render(<HelpWhichModeAmIInGuideView entry={entry} />);

    expect(screen.getByTestId(MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(MODE_GRAVITY_HELP_WHICH_MODE_TOPIC_LABEL);
    expect(screen.getByTestId("help-which-mode-am-i-in-page-title")).toHaveTextContent(MODE_GRAVITY_HELP_WHICH_MODE_TITLE);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-11");
    expect(screen.getByTestId("help-which-mode-am-i-in-header-claim-discipline")).toHaveTextContent(
      MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: MODE_GRAVITY_HELP_WHICH_MODE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${MODE_GRAVITY_HELP_WHICH_MODE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-which-mode-am-i-in-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-which-mode-am-i-in-claim-tag")).toBeInTheDocument();

    expect(screen.getByTestId("help-which-mode-am-i-in-working")).toHaveTextContent(
      MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_WORKING,
    );
    expect(screen.getByTestId("help-which-mode-am-i-in-guided")).toHaveTextContent(
      MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_GUIDED,
    );
    expect(screen.getByTestId("help-which-mode-am-i-in-eval")).toHaveTextContent(
      MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_DEMO,
    );

    for (const heading of MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-which-mode-am-i-in-related-topics");
    for (const topic of MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-which-mode-am-i-in-return-to-help")).toHaveAttribute(
      "href",
      MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN.href,
    );

    expect(screen.queryByTestId("help-which-mode-am-i-in-honesty-panel")).not.toBeInTheDocument();
  });
});
