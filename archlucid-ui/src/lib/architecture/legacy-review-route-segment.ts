/** TB-2234 — Buyer review detail dynamic route segment (App Router folder `[reviewId]`). */

export const REVIEW_DETAIL_ROUTE_SEGMENT = "reviewId" as const;

export const REVIEW_DETAIL_ROUTE_PATTERN = `/architecture/reviews/[${REVIEW_DETAIL_ROUTE_SEGMENT}]` as const;

/** @deprecated Legacy App Router segment name — bookmarks use the same URL path; folder renamed TB-2234. */
export const LEGACY_REVIEW_DETAIL_ROUTE_SEGMENT = "runId" as const;

/** Legacy `/runs/{id}` prefix retired toward canonical architecture reviews namespace. */
export const LEGACY_RUN_DETAIL_PATH_PREFIX = "/runs" as const;

export const CANONICAL_REVIEW_DETAIL_PATH_PREFIX = "/architecture/reviews" as const;
