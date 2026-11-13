import { remapArchitectureCreatedOrientationSources } from "@/lib/architecture/architecture-created-orientation-source-links";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type RunDetailActivitySourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Activity tab Sources — assessment progress / baseline orientation.
 * Twin committed surface is `reviewTab=activity`, not this archTab.
 */
export const RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES: readonly RunDetailActivitySourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
] as const;

export function resolveRunDetailActivityPreCommitSources(
  productLine: ProductLineId,
): readonly RunDetailActivitySourceLink[] {
  return remapArchitectureCreatedOrientationSources(RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES, productLine);
}

export const RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO =
  "Use these follow-ups when create-home Activity progress turns into findings triage, evidence search, or export readiness.";

export const RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE =
  "This create-home Activity tab shows assessment progress and baseline context before finalize. It is not a finalized review record export trail";
