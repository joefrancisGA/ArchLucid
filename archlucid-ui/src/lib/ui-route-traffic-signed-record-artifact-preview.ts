import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Traffic workbook row ID for manifest-scoped artifact preview.
 * Owner backlog shorthand: MAM.
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID = "MAM";

/** Canonical path tracked on the MAM workbook row. */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH = `${SIGNED_RECORDS_LIST_PATH}/[manifestId]/artifacts/[artifactId]`;

/**
 * Owner workbook Notes for MAM — documents ghost route pending TB-1824 restore.
 * Section retag to Core review stays on TB-1949 after the page lands.
 */
export const SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE =
  "Manifest-scoped artifact preview — ghost route (no App Router page.tsx); Preview hrefs 404 pending restore TB-1824/TB-1947. Pairs run-scoped RER. Download/proxy paths may still work.";
