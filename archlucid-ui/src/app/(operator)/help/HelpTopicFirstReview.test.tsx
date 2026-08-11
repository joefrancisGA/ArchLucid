import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/first-review",
}));

import { HelpFirstReviewEvidenceChecklistGuideView } from "@/app/(operator)/help/_sections/HelpFirstReviewEvidenceChecklistGuideView";
import {
  FIRST_REVIEW_HELP_PRIMARY_ACTIONS,
  FIRST_REVIEW_HELP_SOURCES,
} from "@/lib/first-review-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadFoldedInternalRunbook } from "@/lib/load-product-documentation";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";

const FIRST_REVIEW_HELP_BANNED_SUBSTRINGS = [
  "GET /health/ready",
  "POST /v1/azure-extractor/upload",
  "collect-first-pilot-proof",
  "contributor-reference",
  "V1_SCOPE",
  "LIVE_E2E_HAPPY_PATH",
  "PILOT_RESCUE_PLAYBOOK",
  "deploy/customer-templates",
] as const;

describe("HelpFirstReviewEvidenceChecklistGuideView (folded into COR, Batch R)", () => {
  const loaded = tryLoadFoldedInternalRunbook("first-review");

  it("permanently redirects the retired first-review slug to COR printable checklist anchor", () => {
    expect(resolveHelpTopicPermanentRedirect("first-review")).toBe(
      "/help/first-architecture-review#printable-first-run-evidence-checklist",
    );
  });

  it("loads first-review help from the operator-path printable section", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("first-review");
    expect(loaded?.entry.sourcePaths[0]).toBe("docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md");
    expect(loaded?.entry.sectionAnchors).toEqual(["printable-first-run-evidence-checklist"]);
    expect(loaded?.markdown.toLowerCase()).toContain("printable first-run evidence checklist");
    expect(loaded?.markdown.toLowerCase()).not.toContain("first value in 20 minutes");
  });

  it("renders specialty Admin chrome without API/runbook leakage", () => {
    if (loaded === null) {
      throw new Error("Expected first-review documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "first-review",
    });

    render(<HelpFirstReviewEvidenceChecklistGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = document.body.textContent ?? "";

    expect(screen.getByTestId("help-first-review-evidence-checklist-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-review-evidence-arc")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-review-claim-discipline")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-first-review-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.label,
      }),
    ).toHaveAttribute("href", FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.href);

    expect(
      within(actionPanel).getByRole("link", {
        name: FIRST_REVIEW_HELP_PRIMARY_ACTIONS.startArchitectureReview.label,
      }),
    ).toHaveAttribute("href", FIRST_REVIEW_HELP_PRIMARY_ACTIONS.startArchitectureReview.href);

    expect(screen.queryByTestId("help-first-review-sources")).toBeNull(); // TB-2092
for (const banned of FIRST_REVIEW_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `banned substring still present: ${banned}`).not.toContain(banned);
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(preparedMarkdown.toLowerCase()).not.toContain("contributor-reference");
    expect(preparedMarkdown).not.toMatch(/\]\([^)]*scripts\//i);
  });
});
