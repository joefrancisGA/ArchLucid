import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";

/**
 * Review href resolver map (desk continuity + Working nested jobs):
 * - Operate/governance “open review” surfaces: {@link resolveGovernanceScopedReviewOpenHref} (this module wraps it for naming clarity).
 * - Explicit architecture id known from props/SSR: `resolveArchitectureReviewHref` in `architecture-routes`.
 * - URL-sync (`router.replace`) matching current desk shape: `resolveReviewUrlStatePathname` in `review-url-state-pathname`.
 * - Suffix paths on the scoped base (for example `/provenance`): `resolveScopedReviewPath` in `review-url-state-pathname`.
 * - Tab + query + hash on the review workspace: `buildReviewDetailTabHref` in `review-detail-workspace-tabs`.
 */

/** Operate surfaces (alerts, advisory, digests) scoped to a review run id. */
export function resolveOperatorScopedRunReviewHref(
  runId: string,
  architectureId?: string | null,
): string {
  return resolveGovernanceScopedReviewOpenHref({ runId, architectureId });
}
