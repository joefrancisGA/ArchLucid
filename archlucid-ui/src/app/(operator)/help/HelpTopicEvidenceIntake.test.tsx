import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpEvidenceIntakeGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeGuideView";
import {
  EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTION,
} from "@/lib/evidence-intake-help-evidence-copy";
import {
  EVIDENCE_INTAKE_HELP_PATH_OPTIONS,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS,
  EVIDENCE_INTAKE_HELP_RELATED_GUIDES,
  EVIDENCE_INTAKE_HELP_VERIFY_STEPS,
} from "@/lib/evidence-intake-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
} from "@/lib/reviews-new-path-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "evidence-intake";

describe("HelpEvidenceIntakeGuideView (EVI)", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers provenance metadata and a customer PDF strategy", () => {
    expect(entry?.title).toBe("Start a review");
    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toContain("V1 GA");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("renders specialty wizard companion chrome with Start and path CTAs (TB-1350 / TB-1351)", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(<HelpEvidenceIntakeGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-evidence-intake-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-evidence-intake-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId(EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.href,
    );

    const actionPanel = screen.getByTestId("help-evidence-intake-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnections.label,
      }),
    ).toHaveAttribute("href", EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnections.href);

    const pathStrip = screen.getByTestId("help-evidence-intake-path-strip");

    for (const pathOption of EVIDENCE_INTAKE_HELP_PATH_OPTIONS) {
      const row = screen.getByTestId(`help-evidence-intake-path-${pathOption.id}`);

      expect(within(row).getByRole("link", { name: pathOption.label })).toHaveAttribute(
        "href",
        pathOption.href,
      );
    }

    expect(within(pathStrip).getByRole("link", { name: "Quick start" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_QUICK_REVIEW_HREF,
    );
    expect(within(pathStrip).getByRole("link", { name: "Guided questions" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_GUIDED_INTAKE_HREF,
    );
    expect(within(pathStrip).getByRole("link", { name: "Templates and imports" })).toHaveAttribute(
      "href",
      REVIEWS_NEW_DETAILED_HREF,
    );
  });

  it("renders actionable verify-intake links and claim discipline (TB-1354)", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(<HelpEvidenceIntakeGuideView entry={entry} markdown={loaded.markdown} />);

    const verifyPanel = screen.getByTestId("help-evidence-intake-verify-panel");

    for (const step of EVIDENCE_INTAKE_HELP_VERIFY_STEPS) {
      expect(within(verifyPanel).getByRole("link", { name: step.action.label })).toHaveAttribute(
        "href",
        step.action.href,
      );
    }

    expect(screen.getByText(EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });

  it("canonicalizes related guides to first-architecture-review (TB-1352)", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    render(<HelpEvidenceIntakeGuideView entry={entry} markdown={loaded.markdown} />);

    const related = screen.getByTestId("help-evidence-intake-related-guides-links");

    for (const link of EVIDENCE_INTAKE_HELP_RELATED_GUIDES) {
      expect(within(related).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(related.textContent ?? "").not.toContain("/help/first-hour-operator-path");
    expect(related.textContent ?? "").not.toContain("/help/pilot-guide");
  });

  it("strips duplicate structured sections and admission-gate jargon from markdown body (TB-1351)", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-intake help to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "evidence-intake",
    });

    expect(preparedMarkdown.toLowerCase()).not.toContain("admission gate");
    expect(preparedMarkdown).not.toContain("## Related guides");
    expect(preparedMarkdown).not.toContain("## Choose a starting path");

    render(<HelpEvidenceIntakeGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visibleText = document.body.textContent ?? "";

    expect(visibleText).not.toContain("Guided intake");
    expect(visibleText).not.toMatch(/admission gates?/i);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-10");
  });
});
