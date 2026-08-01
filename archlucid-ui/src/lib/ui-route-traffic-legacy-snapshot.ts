import {
  LEGACY_SNAPSHOT_PATH_PATTERN,
  LEGACY_SNAPSHOT_PATH_PREFIX,
} from "@/lib/legacy-snapshot-route";

/**
 * Traffic workbook row ID for the legacy snapshot redirect shim.
 * Owner backlog shorthand: SNU.
 */
export const LEGACY_SNAPSHOT_TRAFFIC_ROW_ID = "SRN";

/** Canonical path tracked on the SRN workbook row. */
export const LEGACY_SNAPSHOT_TRAFFIC_PATH = LEGACY_SNAPSHOT_PATH_PATTERN;

/**
 * Owner workbook Notes for SRN — documents redirect-only shim to review workspace read-only mode.
 */
export const LEGACY_SNAPSHOT_TRAFFIC_NOTE =
  "Legacy snapshot leave-behind — App Router shim redirects to /reviews/{runId} with readOnly=1 (query preserved, TB-1951). Showcase run uses Claims Intake spine. Canonical UX on review workspace rows.";

/** Robots-disallow prefix for marketing SEO inventory guards. */
export const LEGACY_SNAPSHOT_ROBOTS_DISALLOW_PREFIX = LEGACY_SNAPSHOT_PATH_PREFIX;
