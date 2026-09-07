import {
  architectureIdentityPath,
  architectureNestedDraftPath,
  architectureNestedReviewPath,
  resolveArchitectureReviewHref,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

/**
 * Redirects legacy Working peer review URLs to nested architecture job URLs (ADR 0077 / AO-06).
 * Returns null when the pathname is not a peer review route.
 */
export function resolveWorkingPeerReviewRedirectHref(input: {
  readonly architectureId: string;
  readonly reviewId: string;
  readonly pathname: string;
  readonly search?: string | null;
}): string {
  const architectureId = input.architectureId.trim();
  const reviewId = input.reviewId.trim();
  const peerPrefix = `${reviewDetailPath(reviewId)}`;
  const pathname = input.pathname.split("?")[0] ?? "";

  if (!pathname.startsWith(peerPrefix)) {
    return architectureNestedReviewPath(architectureId, reviewId);
  }

  const suffix = pathname.slice(peerPrefix.length);
  const nestedBase = architectureNestedReviewPath(architectureId, reviewId);
  const search = input.search?.trim() ?? "";

  if (search.length > 0) {
    const normalizedSearch = search.startsWith("?") ? search : `?${search}`;

    return `${nestedBase}${suffix}${normalizedSearch}`;
  }

  return `${nestedBase}${suffix}`;
}

/** True when a run's architecture id disagrees with the nested route segment. */
export function isNestedReviewArchitectureMismatch(
  routeArchitectureId: string,
  runArchitectureId: string | null | undefined,
): boolean {
  const expected = routeArchitectureId.trim();
  const actual = runArchitectureId?.trim() ?? "";

  if (expected.length === 0 || actual.length === 0) {
    return false;
  }

  return expected !== actual;
}

export function resolveArchitectureReviewHrefForWorkingDesk(
  reviewId: string,
  architectureId: string,
): string {
  return resolveArchitectureReviewHref(reviewId, architectureId);
}

export function architectureDeskPath(architectureId: string): string {
  return architectureIdentityPath(architectureId);
}

/** Nested or peer review workspace tab deep link when architecture id is known (AO-08). */
export function resolveArchitectureReviewTabHref(
  reviewId: string,
  tab: ReviewDetailTabId,
  architectureId?: string | null,
): string {
  const base = resolveArchitectureReviewHref(reviewId, architectureId);
  const params = new URLSearchParams({ reviewTab: tab });

  return `${base}?${params.toString()}`;
}
