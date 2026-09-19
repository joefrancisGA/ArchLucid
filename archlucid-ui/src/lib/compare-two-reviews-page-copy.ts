import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Leaf title copy for compare-two-reviews — no registry imports (avoids circular init). */
export const COMPARE_TWO_REVIEWS_PRIMARY_CONTENT_ID = "compare-two-reviews-primary-content" as const;

export const COMPARE_TWO_REVIEWS_FIRST_VIEWPORT_TEST_ID = "compare-two-reviews-first-viewport" as const;

export const COMPARE_TWO_REVIEWS_SKIP_TARGET_ID = COMPARE_TWO_REVIEWS_FIRST_VIEWPORT_TEST_ID;

export const COMPARE_TWO_REVIEWS_SKIP_LINK_LABEL = "Skip to compare workspace" as const;

export const COMPARE_TWO_REVIEWS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "compare-two-reviews-header-claim-discipline" as const;

export const COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID = "compare-two-reviews-orientation-bottom" as const;

export const COMPARE_TWO_REVIEWS_WORKSPACE_TEST_ID = "compare-workspace" as const;

export const COMPARE_PAGE_SUBTITLE_BUYER =
  "See what changed in scope, findings, decisions, and evidence between two finalized reviews." as const;

export const COMPARE_START_HERE_HELPER =
  "Pick baseline and updated reviews below, then compare to see structured changes before sharing a leadership summary." as const;

export const COMPARE_PAGE_LEAD =
  "Structured changes in scope, findings, decisions, and evidence between two finalized architecture reviews." as const;

export function compareBuyerOverview(productLineId: ProductLineId): string {
  return `Use the dimension preview above to confirm what ${productLineDisplayName(productLineId)} compares, then follow the checklist and review pickers below to run the diff and share a leadership summary when ready.`;
}

/** Architecture default for tests and legacy imports. */
export const COMPARE_BUYER_OVERVIEW = compareBuyerOverview("architecture");
