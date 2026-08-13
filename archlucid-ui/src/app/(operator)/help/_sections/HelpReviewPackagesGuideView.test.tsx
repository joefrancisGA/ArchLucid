import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpReviewPackagesGuideView } from "@/app/(operator)/help/_sections/HelpReviewPackagesGuideView";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  prepareReviewPackagesHelpBodyMarkdown,
  REVIEW_PACKAGES_HELP_OVERVIEW,
  REVIEW_PACKAGES_HELP_PAGE_TITLE,
  REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS,
  REVIEW_PACKAGES_HELP_RELATED,
  stripReviewPackagesOpeningLedeFromMarkdown,
  stripReviewPackagesRelatedGuidesFromMarkdown,
} from "@/lib/review-packages-help-guide-content";
import { REVIEW_PACKAGES_HELP_EXPORT_ACTIONS } from "@/lib/review-packages-help-export-copy";
import { formatReviewGuideHelpProvenanceLine } from "@/lib/review-guide-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "review-packages";

describe("HelpReviewPackagesGuideView", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers provenance and customer PDF status for architecture packages", () => {
    expect(entry?.title).toBe("Architecture packages");
    expect(entry?.audience).toBe("operator");
    expect(entry?.lastReviewed).toBe("2026-08-11");
    expect(entry?.releaseApplicability).toBe(
      "architecture package browse, inspect, and export workflow",
    );
    expect(entry?.pdfStatus).toBe("customer");
    expect(inAppHelpHref(GUIDE_SLUG)).toBe("/help/review-packages");
    expect(formatReviewGuideHelpProvenanceLine(entry!)).toBe(
      "Source: REVIEW_PACKAGES_OPERATOR_GUIDE.md",
    );
  });

  it("loads user-facing markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded!.markdown.length).toBeGreaterThan(200);
  });

  it("renders specialty root with h1, provenance, print, and Open reviews CTAs", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    const { container } = render(
      <HelpReviewPackagesGuideView entry={entry} markdown={loaded.markdown} />,
    );

    const title = screen.getByTestId("help-review-packages-page-title");

    expect(title).toHaveTextContent(REVIEW_PACKAGES_HELP_PAGE_TITLE);
    expect(title.tagName).toBe("H1");

    expect(screen.getByTestId("help-review-guide-provenance")).toHaveTextContent(
      "Source: REVIEW_PACKAGES_OPERATOR_GUIDE.md",
    );

    const headerActions = screen.getByTestId("help-review-packages-header-actions");
    const openReviews = within(headerActions).getByTestId("help-review-packages-open-reviews");

    expect(openReviews).toHaveAttribute("href", REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS.openReviews.href);
    expect(within(headerActions).getByTestId("help-topic-print-pdf")).toBeInTheDocument();

    expect(screen.getByTestId("help-review-packages-open-reviews-footer")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );

    expect(screen.getByTestId("help-review-packages-overview")).toHaveTextContent(
      REVIEW_PACKAGES_HELP_OVERVIEW,
    );
    expect(REVIEW_PACKAGES_HELP_OVERVIEW).toMatch(/review produces one architecture package/i);

    expect(screen.queryByTestId("help-review-packages-action-panel")).toBeNull();
    expect(container.innerHTML).not.toMatch(/bg-teal-50|border-teal-200/);
  });

  it("renders exactly one Related guides region with the curated link set", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    render(<HelpReviewPackagesGuideView entry={entry} markdown={loaded.markdown} />);

    const relatedHeadings = screen.getAllByRole("heading", { name: "Related guides" });

    expect(relatedHeadings).toHaveLength(1);

    const related = screen.getByTestId("help-review-packages-related");
    const links = within(related).getAllByRole("link");

    expect(links).toHaveLength(REVIEW_PACKAGES_HELP_RELATED.length);

    for (const expected of REVIEW_PACKAGES_HELP_RELATED) {
      const link = within(related).getByRole("link", { name: expected.label });

      expect(link).toHaveAttribute("href", expected.href);
      expect(link.className).toMatch(/min-h-6/);
      expect(link.className).toMatch(/underline/);
    }

    expect(within(related).getByRole("link", { name: "Evidence graph" })).toHaveAttribute(
      "href",
      inAppHelpHref("evidence-trail"),
    );
    expect(within(related).queryByRole("link", { name: "Audit trail" })).toBeNull();

    const content = screen.getByTestId("help-review-packages-content");

    expect(content.textContent).not.toContain("Related guides");
  });

  it("renders export next steps with sample and start-review CTAs and buyer-safe export copy (TB-1403)", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    render(<HelpReviewPackagesGuideView entry={entry} markdown={loaded.markdown} />);

    const exportPanel = screen.getByTestId("help-review-packages-export-next-steps");

    expect(within(exportPanel).getByTestId("help-review-packages-export-buyer-claim").textContent).toMatch(
      /signed review record/i,
    );
    expect(within(exportPanel).getByTestId("help-review-packages-export-buyer-claim").textContent).not.toMatch(
      /signed manifest/i,
    );
    expect(within(exportPanel).getByTestId("help-review-packages-export-empty-copy")).toBeInTheDocument();
    expect(within(exportPanel).getByTestId("help-review-packages-sample-honesty")).toBeInTheDocument();

    const openSample = within(exportPanel).getByTestId(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.openSample.testId);

    expect(openSample).toHaveAttribute("href", REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.openSample.href);

    const startReview = within(exportPanel).getByTestId(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.startReview.testId);

    expect(startReview).toHaveAttribute("href", REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.startReview.href);

    const content = screen.getByTestId("help-review-packages-content");

    expect(content.textContent).not.toMatch(/Signed manifest/i);
  });

  it("strips Related guides and the opening lede from body markdown", () => {
    expect(loaded?.markdown).toContain("## Related guides");
    expect(loaded?.markdown).toContain(
      "Browse, inspect, and export governed architecture packages in the architect workspace.",
    );

    const withoutRelated = stripReviewPackagesRelatedGuidesFromMarkdown(loaded!.markdown);
    const withoutLede = stripReviewPackagesOpeningLedeFromMarkdown(loaded!.markdown);
    const body = prepareReviewPackagesHelpBodyMarkdown(loaded!.markdown);

    expect(withoutRelated).not.toContain("## Related guides");
    expect(withoutLede).not.toContain(
      "Browse, inspect, and export governed architecture packages in the architect workspace.",
    );
    expect(body).not.toContain("## Related guides");
    expect(body).not.toContain(
      "Browse, inspect, and export governed architecture packages in the architect workspace.",
    );
    expect(body).toContain("What an architecture package contains");
  });

  it("keeps TOC free of Related guides after presentation prep", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    const body = prepareReviewPackagesHelpBodyMarkdown(loaded.markdown);
    const prepared = prepareHelpMarkdownForPresentation(body, entry.sourcePaths[0] ?? "", {
      helpTopicSlug: entry.slug,
    });
    const headings = extractHelpMarkdownHeadings(prepared);

    expect(headings.some((heading) => heading.title === "Related guides")).toBe(false);
    expect(headings.some((heading) => /architecture package/i.test(heading.title))).toBe(true);
  });
});
