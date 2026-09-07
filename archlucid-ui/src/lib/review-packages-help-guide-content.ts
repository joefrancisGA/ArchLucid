import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import {
  reviewPackagesHelpRelatedGuides,
  type ReviewPackagesHelpRelatedLink,
} from "@/lib/review-packages-help-related-guides";

export {
  REVIEW_PACKAGES_HELP_PAGE_TITLE,
} from "@/lib/review-packages-help-page-copy";
export const REVIEW_PACKAGES_HELP_PAGE_SUBTITLE =
  "Open Architecture reviews to find packages in your workspace, then inspect findings and share export-ready artifacts.";

/** One orientation statement: definition + review↔package relationship (not browse/inspect/export again). */
export const REVIEW_PACKAGES_HELP_OVERVIEW =
  "A review produces one architecture package — the durable record with findings, evidence, policy results, decisions, and exports after finalize.";

export const REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS = {
  openReviews: {
    label: "Open reviews",
    href: "/architecture/reviews",
  },
} as const;

export type { ReviewPackagesHelpRelatedLink };

/** Authoritative Related guides rail — markdown Related section is stripped for presentation. */
export const REVIEW_PACKAGES_HELP_RELATED: readonly ReviewPackagesHelpRelatedLink[] =
  reviewPackagesHelpRelatedGuides();

const REVIEW_PACKAGES_OPENING_LEDE =
  "Browse, inspect, and export formal architecture packages in the architect workspace.";

/** Drop the markdown Related guides section so the page rail is the only list. */
export function stripReviewPackagesRelatedGuidesFromMarkdown(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ["related guides"], {
    collapseBlankLines: true,
  });
}

/** Drop the opening browse/inspect/export lede duplicated by the page subtitle. */
export function stripReviewPackagesOpeningLedeFromMarkdown(markdown: string): string {
  return markdown
    .split(REVIEW_PACKAGES_OPENING_LEDE)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Body markdown for in-app presentation (Related + duplicate lede removed). */
export function prepareReviewPackagesHelpBodyMarkdown(markdown: string): string {
  return stripReviewPackagesOpeningLedeFromMarkdown(
    stripReviewPackagesRelatedGuidesFromMarkdown(markdown),
  );
}
