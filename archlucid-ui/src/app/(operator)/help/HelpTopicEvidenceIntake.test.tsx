import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { EvidenceIntakeHelpClaimDisciplineStrip } from "@/components/help/EvidenceIntakeHelpClaimDisciplineStrip";
import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import {
  EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTION,
} from "@/lib/evidence-intake-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
} from "@/lib/reviews-new-path-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "evidence-intake";

describe("Start a review help (EVI)", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers provenance metadata and a customer PDF strategy", () => {
    expect(entry?.title).toBe("Start a review");
    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toContain("V1 GA");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("renders a Start review primary action in help-topic-export-actions", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} showContextualHelp />);

    const exportActions = screen.getByTestId("help-topic-export-actions");
    const startReviewLink = within(exportActions).getByRole("link", {
      name: EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.label,
    });

    expect(startReviewLink).toHaveAttribute("href", REVIEWS_NEW_PATH);
    expect(EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.label).toBe(START_REVIEW_LABEL);
  });

  it("renders claim discipline, provenance beside Current, and a single registry summary", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<EvidenceIntakeHelpClaimDisciplineStrip />}
      />,
    );

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-10");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Applies to V1 GA");

    const visibleText = document.body.textContent ?? "";
    const summaryOccurrences = visibleText.split(entry.summary).length - 1;

    expect(summaryOccurrences).toBe(1);
    expect(screen.getByText(EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(visibleText).not.toContain("Sources for follow-up");
    expect(visibleText).not.toContain("Guided intake");
  });

  it("renders deep links for each New architecture review starting path", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} showContextualHelp />);

    const content = screen.getByTestId("help-topic-content");

    expect(within(content).getByRole("link", { name: "New architecture review" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_PATH,
    );
    expect(within(content).getByRole("link", { name: "Quick start" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_QUICK_REVIEW_HREF,
    );
    expect(within(content).getByRole("link", { name: "Guided questions" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_GUIDED_INTAKE_HREF,
    );
    expect(within(content).getByRole("link", { name: "Templates and imports" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_DETAILED_HREF,
    );

    expect(content.textContent).not.toContain("/architecture/reviews/new");
  });
});
