import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpImpactPreviewVsArchitectureEnvelopeGuideView } from "@/app/(operator)/help/_sections/HelpImpactPreviewVsArchitectureEnvelopeGuideView";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImpactPreviewVsArchitectureEnvelopeGuideView (CE-020 / EIM Phase 2)", () => {
  const entry = getProductDocumentationEntry("impact-preview-vs-architecture-envelope");

  it("renders provenance, skip link, claim discipline, policy note, comparison table, contrasted paths, and sponsor panel after content", () => {
    if (entry === undefined) {
      throw new Error("Expected impact-preview-vs-architecture-envelope documentation entry.");
    }

    render(<HelpImpactPreviewVsArchitectureEnvelopeGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-impact-preview-vs-envelope-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-vs-envelope-page-title")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
    );
    expect(screen.getByText(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("CE-020");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("SN-007");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-header-claim-discipline")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-impact-preview-vs-envelope-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-impact-preview-vs-envelope-policy-note")).toHaveTextContent("Policy cheap envelope");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-seat-working")).toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-vs-envelope-record-practice")).toHaveTextContent("Practice");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-record-practice")).toHaveTextContent("Record");

    for (const heading of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    const table = screen.getByTestId("help-impact-preview-vs-envelope-comparison-table");
    expect(within(table).getAllByRole("row").length).toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.length + 1,
    );

    const contrasted = screen.getByTestId("help-impact-preview-vs-envelope-contrasted-paths");
    expect(within(contrasted).getAllByRole("link", { name: "Help topic" }).length).toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS.length,
    );
    expect(within(contrasted).getAllByRole("link", { name: "Open workspace" }).length).toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS.length,
    );
    expect(within(contrasted).getAllByRole("link", { name: "Help topic" })[0]).toHaveAttribute(
      "href",
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS[0]?.helpHref,
    );

    expect(screen.getByTestId("help-impact-preview-vs-envelope-r12")).toHaveTextContent("R12");

    const related = screen.getByTestId("help-impact-preview-vs-envelope-related-topics");
    for (const topic of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-impact-preview-vs-envelope-return-to-help")).toHaveAttribute(
      "href",
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_HELP_RETURN.href,
    );

    const sponsorPanel = screen.getByTestId("help-impact-preview-vs-envelope-honesty-panel");
    expect(related.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
