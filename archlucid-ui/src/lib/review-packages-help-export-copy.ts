import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL } from "@/lib/core-pilot-help-guide-content";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "@/lib/showcase-static-demo";

export const REVIEW_PACKAGES_HELP_EXPORT_NEXT_STEPS_TITLE = "Export from a finalized package";

export const REVIEW_PACKAGES_HELP_EMPTY_WORKSPACE_EXPORT_COPY =
  "If your workspace has no packages yet, open the curated sample to see finalized exports, or start an architecture review to build your first package.";

export const REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM =
  "Finalized review record links and sponsor exports appear on the Evidence tab after you finalize the architecture review.";

export const REVIEW_PACKAGES_HELP_SAMPLE_HONESTY =
  `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} sample — illustrative only; not from your workspace.`;

export const REVIEW_PACKAGES_HELP_EXPORT_ACTIONS = {
  openSample: {
    label: CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL,
    href: showcaseSampleReviewPackageHref(),
    testId: "help-review-packages-open-sample",
  },
  startReview: {
    label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    href: "/architecture/reviews/new",
    testId: "help-review-packages-start-review",
  },
} as const;

export const REVIEW_PACKAGES_HELP_EXPORT_HONESTY_SOURCE_FILES: readonly string[] = [
  "docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md",
] as const;

export const BANNED_REVIEW_PACKAGES_HELP_EXPORT_PATTERNS: readonly RegExp[] = [
  /\*\*Signed manifest\*\*/i,
  /\bSigned manifest\b/i,
] as const;

export function sourceContainsBannedReviewPackagesHelpExportCopy(source: string): boolean {
  return BANNED_REVIEW_PACKAGES_HELP_EXPORT_PATTERNS.some((pattern) => pattern.test(source));
}
