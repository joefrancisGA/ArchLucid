import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpImpactPreviewGuideView } from "@/app/(operator)/help/_sections/HelpImpactPreviewGuideView";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_HELP_SOURCES,
} from "@/lib/impact-preview-help-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION,
  IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION_TAG,
  IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID,
  IMPACT_PREVIEW_HELP_GUIDE_HEADINGS,
  IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_PRIMARY_ACTION,
  IMPACT_PREVIEW_HELP_START_HERE_CARD_TITLE,
} from "@/lib/impact-preview-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImpactPreviewGuideView", () => {
  const entry = getProductDocumentationEntry("impact-preview");

  it("renders breadcrumb, provenance, baseline precondition, readingBody, and claim discipline", () => {
    if (entry === undefined) {
      throw new Error("Expected impact-preview documentation entry.");
    }

    render(<HelpImpactPreviewGuideView entry={entry} />);

    expect(screen.getByTestId("help-impact-preview-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · insights impact preview orientation",
    );
    expect(screen.getByTestId("help-impact-preview-baseline-precondition")).toHaveTextContent(
      IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION,
    );
    expect(screen.getByTestId("help-impact-preview-baseline-precondition-tag")).toHaveTextContent(
      IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-impact-preview-claim-discipline").textContent).toContain(
      IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-impact-preview-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-impact-preview-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("link", { name: IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: IMPACT_PREVIEW_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What you provide" }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle.split(" ")[0],
    );
    expect(screen.getByRole("heading", { name: "What impact preview returns" })).toBeInTheDocument();

    for (const item of IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const item of IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of IMPACT_PREVIEW_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    for (const heading of IMPACT_PREVIEW_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
