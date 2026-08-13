import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ReviewPackagesHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

/** TB-1402: at most three related guides that support browse/inspect without competing with Open reviews. */
export const REVIEW_PACKAGES_HELP_RELATED_GUIDES: readonly ReviewPackagesHelpRelatedLink[] = [
  { label: "Start a review", href: inAppHelpHref("evidence-intake") },
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Evidence graph", href: inAppHelpHref("evidence-trail") },
] as const;

export const REVIEW_PACKAGES_HELP_BANNED_RELATED_HELP_SLUGS: readonly string[] = [
  "review-guide",
  "governance-approval",
] as const;

/** Related guides for `/help/review-packages`. */
export function reviewPackagesHelpRelatedGuides(): readonly ReviewPackagesHelpRelatedLink[] {
  return REVIEW_PACKAGES_HELP_RELATED_GUIDES;
}
