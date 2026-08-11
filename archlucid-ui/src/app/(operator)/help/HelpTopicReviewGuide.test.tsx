import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpReviewGuideView } from "@/app/(operator)/help/_sections/HelpReviewGuideView";
import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
} from "@/lib/review-guide-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "review-guide";
const GUIDE_SOURCE = "docs/library/customer-facing/REVIEW_GUIDE.md";

const BANNED_INTERNAL_COPY = [
  "smoke test",
  "demo seed",
  "curl ",
  "support bundle",
  "localhost",
  "static operator",
  "run-of-show",
  "ci decoration",
] as const;

const TOC_SECTION_TITLES = [
  "Name the review",
  "Upload architecture evidence",
  "Add architecture context",
  "Confirm review scope",
  "Start the review",
  "Review findings and evidence",
  "Finalize the architecture package",
  "Related guides",
] as const;

describe("Review guide (HR)", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers the buyer-safe review guide title, route, and provenance", () => {
    expect(entry?.title).toBe("Review guide");
    expect(entry?.audience).toBe("buyer");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.pdfStatus).toBe("public");
    expect(inAppHelpHref(GUIDE_SLUG)).toBe("/help/review-guide");
  });

  it("loads user-facing markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded!.markdown.length).toBeGreaterThan(200);
  });

  it("renders HelpReviewGuideView with provenance, export actions, and a single start-review control", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    const { container } = render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-review-guide-page-title")).toHaveTextContent("Review guide");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-review-guide-content").textContent).toContain(
      REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
    );

    const headerActions = screen.getByTestId("help-review-guide-header-actions");
    const startReviewLinks = within(headerActions).getAllByRole("link", {
      name: REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label,
    });

    expect(startReviewLinks).toHaveLength(1);
    expect(startReviewLinks[0]).toHaveAttribute("href", REVIEWS_NEW_PATH);

    expect(
      within(headerActions).getByRole("link", { name: REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label }),
    ).toHaveAttribute("href", FIRST_REVIEW_GUIDE_PATH);

    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();

    expect(screen.queryByTestId("help-review-guide-action-panel")).toBeNull();
    expect(container.innerHTML).not.toMatch(/bg-teal-50|border-teal-200/);
  });

  it("renders field-reference tables and avoids duplicate start-review labels in markdown links", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    const content = screen.getByTestId("help-review-guide-content");
    const tables = within(content).getAllByRole("table");

    expect(tables.length).toBeGreaterThanOrEqual(1);

    const markdownLinks = within(content).getAllByRole("link");
    const startReviewMarkdownLinks = markdownLinks.filter((link) =>
      /start.*review/i.test(link.textContent ?? ""),
    );

    expect(startReviewMarkdownLinks).toHaveLength(0);

    const evidenceIntakeLinks = within(content).getAllByRole("link", {
      name: "Evidence intake: accepted formats",
    });

    expect(evidenceIntakeLinks.length).toBeGreaterThanOrEqual(1);
    expect(evidenceIntakeLinks.every((link) => link.getAttribute("href") === "/help/evidence-intake")).toBe(true);

    const firstReviewLinks = within(content).getAllByRole("link", { name: "Your first architecture review" });

    expect(firstReviewLinks).toHaveLength(1);
    expect(firstReviewLinks[0]).toHaveAttribute("href", FIRST_REVIEW_GUIDE_PATH);
  });

  it("renders the guide without internal pilot or engineering language", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    expect(visibleText).not.toContain("pilot guide");
    expect(visibleText).not.toMatch(/\b2–3 sentences\b/);

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("renders the buyer-facing review steps", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    for (const title of TOC_SECTION_TITLES) {
      if (title === "Related guides") {
        continue;
      }

      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it("renders on-this-page navigation headings", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, GUIDE_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpReviewGuideView entry={entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    for (const title of TOC_SECTION_TITLES) {
      expect(within(toc).getByRole("link", { name: title })).toBeInTheDocument();
    }

    expect(headings.map((heading) => heading.title)).toEqual(expect.arrayContaining([...TOC_SECTION_TITLES]));
  });
});
