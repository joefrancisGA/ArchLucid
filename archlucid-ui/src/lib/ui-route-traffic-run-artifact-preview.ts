/**
 * Removed traffic workbook row ID for run-scoped artifact Preview (TB-1821).
 * Do not reintroduce as a scored surface — Preview hrefs emit GAR only; App Router
 * RER page remains as a bookmark permanentRedirect into GAR (catalog redirect-only).
 */
export const REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "RER";

/** Bookmark redirect path — not scored; product Preview uses GAR. */
export const RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  "/architecture/reviews/[runId]/artifacts/[artifactId]" as const;

/** Canonical signed-record artifact preview scored on traffic row GAR. */
export const CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  "/governance/signed-records/[manifestId]/artifacts/[artifactId]" as const;
