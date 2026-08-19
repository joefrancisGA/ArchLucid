import {
 CANONICAL_EXEC_DIGEST_SCHEDULE_PATH,
 RETIRED_SETTINGS_EXEC_DIGEST_PATH,
} from "@/lib/settings-sponsor-digest-legacy-route";

/**
 * Removed traffic workbook row ID for the retired `/settings/sponsor-digest` bookmark.
 * Do not reintroduce — schedule UX is scored only on DIS (`/architecture/digests?tab=schedule`).
 */
export const REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID = "EEX";

/**
 * Prior removed row ID (pre-EEX shorthand). Do not reintroduce — including as a
 * mistaken owner alias for the Digests Schedule tab (canonical ID remains DIS).
 */
export const REMOVED_SETTINGS_EXEC_DIGEST_LEGACY_TRAFFIC_ROW_ID = "SEX";

/** Retired path — not a live App Router page or next.config redirect. */
export const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH = RETIRED_SETTINGS_EXEC_DIGEST_PATH;

/** Canonical Digests Schedule tab scored on traffic row ARS. */
export const CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH = CANONICAL_EXEC_DIGEST_SCHEDULE_PATH;
