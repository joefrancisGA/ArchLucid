import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpPilotGuideView } from "@/app/(operator)/help/_sections/HelpPilotGuideView";
import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";
import { PILOT_GUIDE_HELP_PRIMARY_ACTIONS } from "@/lib/pilot-guide-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "pilot-guide";
const GUIDE_SOURCE = "docs/library/customer-facing/PILOT_GUIDE.md";

const BANNED_INTERNAL_COPY = [
  "smoke test",
  "demo seed",
  "curl ",
  "localhost",
  "static operator",
  "run-of-show",
  "ci decoration",
] as const;

describe("Pilot guide (HP)", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers the buyer-safe pilot guide title, route, and provenance", () => {
    expect(entry?.title).toBe("Pilot guide");
    expect(entry?.audience).toBe("buyer");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.pdfStatus).toBe("public");
    expect(inAppHelpHref(GUIDE_SLUG)).toBe("/help/pilot-guide");
  });

  it("loads user-facing markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded!.markdown.length).toBeGreaterThan(200);
  });

  it("renders HelpPilotGuideView with provenance, claim discipline, export actions, and header CTAs", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected pilot guide to load.");
    }

    const { container } = render(<HelpPilotGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-pilot-guide-page-title")).toHaveTextContent("Pilot guide");
    expect(screen.getByRole("heading", { level: 1, name: "Pilot guide" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("pilot-guide-help-claim-discipline")).toHaveTextContent(
      PILOT_GUIDE_HELP_CLAIM_DISCIPLINE,
    );

    const headerActions = screen.getByTestId("help-pilot-guide-header-actions");
    const startReviewLinks = within(headerActions).getAllByRole("link", {
      name: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    });

    expect(startReviewLinks).toHaveLength(1);
    expect(startReviewLinks[0]).toHaveAttribute("href", REVIEWS_NEW_PATH);

    expect(
      within(headerActions).getByRole("link", {
        name: PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label,
      }),
    ).toHaveAttribute("href", FIRST_ARCHITECTURE_REVIEW_HELP_PATH);

    const relatedLinks = screen.getByTestId("help-pilot-guide-related-links");

    expect(
      within(relatedLinks).getByRole("link", { name: PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label }),
    ).toHaveAttribute("href", FIRST_REVIEW_GUIDE_PATH);

    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();

    expect(screen.queryByTestId("help-pilot-guide-action-panel")).toBeNull();
    expect(container.innerHTML).not.toMatch(/bg-teal-50|border-teal-200/);
  });

  it("renders pilot workflow sections without internal engineering language", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected pilot guide to load.");
    }

    render(<HelpPilotGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 2, name: "Prepare for a pilot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Run the first review" })).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("renders on-this-page navigation headings", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected pilot guide to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, GUIDE_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpPilotGuideView entry={entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    expect(within(toc).getByRole("link", { name: "Prepare for a pilot" })).toBeInTheDocument();
    expect(within(toc).getByRole("link", { name: "Run the first review" })).toBeInTheDocument();
    expect(headings.length).toBeGreaterThan(2);
  });
});
