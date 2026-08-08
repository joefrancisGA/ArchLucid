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
 * Owner workbook Notes for GAR — canonical signed-record artifact preview (SoT for RER redirect).
 * ASCII-only for Windows console note scripts.
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE =
  "Manifest-scoped artifact preview (Alerts/gov) - SignedRecordArtifactPageView with PageContextualHelpButton (topic map review-artifacts; Category-1 registry), SignedRecordEvidenceOrientationStrip Sources + claim-discipline, metadata/download, ArtifactReviewContent preview, sibling ArtifactListTable (TB-1821 SoT under /governance/signed-records). Formerly `/signed-records/.../artifacts/...`. Run-scoped RER permanentRedirects here. Download/proxy paths remain available. Does not imply CPA SOC 2 or third-party pen-test publication.";

/** Workbook Section column value (Alerts/gov — matches template catalog). */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION = "Alerts/gov";
