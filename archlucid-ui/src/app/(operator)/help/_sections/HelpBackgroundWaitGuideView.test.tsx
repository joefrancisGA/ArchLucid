import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpBackgroundWaitGuideView } from "@/app/(operator)/help/_sections/HelpBackgroundWaitGuideView";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBackgroundWaitGuideView (DW-015 / HBA)", () => {
  const entry = getProductDocumentationEntry("background-wait");

  it("renders provenance, anchored sections, cancel clarity, shortcuts, related topics, and sponsor panel after content", () => {
    if (entry === undefined) {
      throw new Error("Expected background-wait documentation entry.");
    }

    render(<HelpBackgroundWaitGuideView entry={entry} />);

    expect(screen.getByTestId("help-background-wait-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-background-wait-page-title")).toHaveTextContent(
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("ADR 0096");
    expect(screen.getByTestId("help-background-wait-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-background-wait-overview").textContent?.toLowerCase()).not.toMatch(
      /stay on this page/i,
    );

    for (const heading of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    const cancelSection = screen.getByTestId("help-background-wait-cancel-clarity");

    for (const action of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY.actions) {
      expect(within(cancelSection).getByText(action.explanation)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-background-wait-no-percentage").textContent).toMatch(/percentComplete/i);
    expect(screen.getByTestId("help-background-wait-completion-check-back").textContent?.toLowerCase()).not.toMatch(
      /we will email you/i,
    );

    expect(screen.getByTestId("help-background-wait-open-shortcuts-link")).toHaveAttribute(
      "href",
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
    );

    const related = screen.getByTestId("help-background-wait-related-topics");

    for (const topic of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-background-wait-return-to-help")).toHaveAttribute(
      "href",
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN.href,
    );

    const relatedSection = screen.getByTestId("help-background-wait-related-topics");
    const sponsorPanel = screen.getByTestId("help-background-wait-honesty-panel");

    expect(relatedSection.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
