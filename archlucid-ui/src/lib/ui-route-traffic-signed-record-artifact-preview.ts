import { LEGACY_SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Traffic workbook row ID for manifest-scoped artifact preview.
 * Owner backlog shorthand: MAM.
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "MAM";

/** Canonical path tracked on the MAM workbook row. */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION = "Marketing";

/** Public App Router path still discovered for traffic catalog (paired with governance SoT pages). */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH =
  `${LEGACY_SIGNED_RECORDS_LIST_PATH}/[manifestId]/artifacts/[artifactId]` as const;

/**
 * Owner workbook Notes for MAM — canonical signed-record artifact preview (SoT for RER redirect).
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE =
  "Manifest-scoped artifact preview — App Router page under signed-records (TB-1821 SoT). Run-scoped RER redirects here. Download/proxy paths remain available.";

/** Workbook Section column value (Core review — not Marketing). */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION = "Core review";
