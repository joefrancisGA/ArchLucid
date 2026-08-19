import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";

export const REVIEW_GUIDE_HELP_PATH = "/help/review-guide" as const;

export const REVIEW_GUIDE_HELP_PAGE_TITLE = "Review guide";

export const REVIEW_GUIDE_HELP_PAGE_SUBTITLE =
  "Field reference for naming a review, uploading evidence, confirming scope, and finalizing the architecture review.";

export const REVIEW_GUIDE_HELP_OVERVIEW =
  "Use this guide while you create or finish an architecture review. It complements the First review guide walkthrough with the field-level steps architects follow in the wizard.";

/** Pins the export-claim sentence in REVIEW_GUIDE.md so it also reaches the generated PDF, not just the page. */
export const REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This field reference describes the New architecture review wizard — it is product help, not a sealed review record or a finalized architecture review export. Match labels and requirements to the live wizard before treating a printed copy as procurement evidence.";

export type ReviewGuideHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

/** High-value follow-ups for a wizard field reference (TB-1262). */
export const REVIEW_GUIDE_HELP_RELATED_GUIDES: readonly ReviewGuideHelpRelatedLink[] = [
  { label: "Evidence intake: accepted formats", href: inAppHelpHref("evidence-intake") },
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
] as const;

/** Secondary help topics — collapsed under Related guides (TB-1262). */
export const REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES: readonly ReviewGuideHelpRelatedLink[] = [
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Evidence graph", href: inAppHelpHref("evidence-trail") },
] as const;

export const REVIEW_GUIDE_HELP_PRIMARY_ACTIONS = {
  startReview: {
    label: "Start architecture review",
    href: REVIEWS_NEW_PATH,
  },
  firstReviewGuide: {
    label: "New here? Guided walkthrough",
    href: FIRST_REVIEW_GUIDE_PATH,
  },
  findingsGuide: {
    label: "Findings help",
    href: inAppHelpHref("findings"),
  },
} as const;

/** Title-block source-of-record line for `/help/review-guide` (does not use shared registry formatter). */
export function formatReviewGuideHelpProvenanceLine(entry: ProductDocumentationEntry): string | null {
  const parts: string[] = [];

  const sourcePath = entry.sourcePaths[0];

  if (sourcePath !== undefined && sourcePath.trim().length > 0) {
    const segments = sourcePath.trim().replace(/\\/g, "/").split("/");
    const fileName = segments[segments.length - 1];

    if (fileName !== undefined && fileName.length > 0) {
      parts.push(`Source: ${fileName}`);
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}

/** Removes the pinned claim sentence from body markdown so the bordered notice is the single on-page copy. */
export function stripReviewGuideClaimDisciplineFromMarkdown(markdown: string): string {
  return markdown
    .split(REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Drop the markdown Related guides section so the page rail is the only list (TB-1262). */
export function stripReviewGuideRelatedGuidesFromMarkdown(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ["related guides"], {
    collapseBlankLines: true,
  });
}

/** Body markdown for in-app presentation (claim discipline + Related section removed). */
export function prepareReviewGuideHelpBodyMarkdown(markdown: string): string {
  return stripReviewGuideRelatedGuidesFromMarkdown(stripReviewGuideClaimDisciplineFromMarkdown(markdown));
}
