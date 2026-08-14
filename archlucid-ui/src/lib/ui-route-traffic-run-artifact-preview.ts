/**
 * Removed traffic workbook row ID for run-scoped artifact Preview (TB-1821).
 * Do not reintroduce as a scored surface — Preview hrefs emit GAR only.
 * Bookmark-only RER App Router permanentRedirect removed (old URLs 404).
 */
export const REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "RER";

/** Retired run-scoped Preview path — no App Router page; not scored. */
export const RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  "/architecture/reviews/[reviewId]/artifacts/[artifactId]" as const;

/** Canonical signed-record artifact preview scored on traffic row GAR. */
export const CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  "/governance/signed-records/[manifestId]/artifacts/[artifactId]" as const;
