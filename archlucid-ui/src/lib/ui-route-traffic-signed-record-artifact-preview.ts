import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Traffic workbook row ID for manifest-scoped artifact preview.
 * Owner/template shorthand: GAR (formerly MAM on legacy `/signed-records` path).
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "GAR";

/** Canonical path tracked on the GAR workbook row. */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  `${SIGNED_RECORDS_LIST_PATH}/[manifestId]/artifacts/[artifactId]` as const;

/**
 * Owner workbook Notes for GAR - canonical signed-record artifact preview.
 * ASCII-only for Windows console note scripts.
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE =
  "Manifest-scoped artifact preview (Alerts/gov) - SignedRecordArtifactPageView with PageContextualHelpButton (topic map review-artifacts; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092), metadata/download, ArtifactReviewContent preview, ArtifactListTable Preview hrefs emit GAR only (TB-1821 SoT). Run-scoped RER bookmark redirect removed (old URLs 404). Formerly `/signed-records/.../artifacts/...`. Not a Trust Center diligence Sources trail alone. Score 68/100 (2026-08-08) - operator surface at GFN/RE Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.";

/** Workbook Section column value (Alerts/gov - matches template catalog). */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION = "Alerts/gov";
