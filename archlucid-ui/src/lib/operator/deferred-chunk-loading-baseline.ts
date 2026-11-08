/**

 * Hand-rolled deferred-chunk loading placeholders for TB-2391.

 * Keep in sync with `deferred-chunk-loading-contract.test.ts` HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE.

 */

export const HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE_PATHS: readonly string[] = [
  "app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-explanation-collapsible-deferred-chunks.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-tabbed-deferred-chunks.tsx",
  "app/(operator)/architecture/sponsor-dashboard/_sections/sponsor-roi-dashboard-deferred-chunks.tsx",
  "app/(operator)/governance/_sections/governance-workflow-deferred-chunks.tsx",
] as const;
