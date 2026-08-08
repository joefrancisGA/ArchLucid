/**
 * Traffic workbook row ID for run-scoped artifact Preview redirect.
 * Owner backlog shorthand: RER.
 */
export const RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "RER";

/** Canonical path tracked on the RER workbook row. */
export const RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  "/architecture/reviews/[runId]/artifacts/[artifactId]" as const;

/** Workbook Section column value (Core review). */
export const RUN_ARTIFACT_PREVIEW_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for RER — redirect-only entry to GAR signed-record artifact preview.
 * ASCII-only for Windows console note scripts.
 */
export const RUN_ARTIFACT_PREVIEW_TRAFFIC_NOTE =
  "Run-scoped artifact Preview entry (Core review) - App Router permanentRedirect after resolveGoldenManifestIdForRun to GAR `/governance/signed-records/[manifestId]/artifacts/[artifactId]` (TB-1821). No dedicated RER chrome; destination GAR mounts SignedRecordArtifactPageView with PageContextualHelp + SignedRecordEvidenceOrientationStrip. Sibling GAR = SoT preview. Does not imply CPA SOC 2 or third-party pen-test publication. Score 28/100 (2026-08-08) - redirect/shim hard-caps higher Evidence (same band as other redirect surfaces).";
