import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSystemGravityGuideView } from "@/app/(operator)/help/_sections/HelpSystemGravityGuideView";
import {
  SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
  SYSTEM_GRAVITY_HELP_CONCEPT_TILES,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_HELP_RETURN,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_TITLE,
  SYSTEM_GRAVITY_HELP_TOPIC_LABEL,
} from "@/lib/system-gravity-help-guide-content";
import {
  SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID,
  SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL,
  SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID,
} from "@/lib/system-gravity-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSystemGravityGuideView (SG-107 / HSY Phase 2)", () => {
  const entry = getProductDocumentationEntry("system-gravity");

  it("renders breadcrumb, provenance, skip link, concept tiles, headings, and related links without honesty panel", () => {
    if (entry === undefined) {
      throw new Error("Expected system-gravity documentation entry.");
    }

    render(<HelpSystemGravityGuideView entry={entry} />);

    expect(screen.getByTestId(SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(SYSTEM_GRAVITY_HELP_TOPIC_LABEL);
    expect(screen.getByTestId("help-system-gravity-page-title")).toHaveTextContent(SYSTEM_GRAVITY_HELP_TITLE);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-system-gravity-header-claim-discipline")).toHaveTextContent(
      SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-system-gravity-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-system-gravity-claim-tag")).toBeInTheDocument();

    for (const heading of SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    for (const tile of SYSTEM_GRAVITY_HELP_CONCEPT_TILES) {
      expect(screen.getByTestId(`help-system-gravity-tile-${tile.id}`)).toHaveTextContent(tile.title);
    }

    const related = screen.getByTestId("help-system-gravity-related-topics");
    for (const topic of SYSTEM_GRAVITY_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-system-gravity-return-to-help")).toHaveAttribute(
      "href",
      SYSTEM_GRAVITY_HELP_HELP_RETURN.href,
    );

    expect(screen.queryByTestId("help-system-gravity-honesty-panel")).not.toBeInTheDocument();
  });
});
