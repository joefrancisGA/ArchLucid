import {
  CANONICAL_EXEC_DIGEST_SCHEDULE_PATH,
  RETIRED_SETTINGS_EXEC_DIGEST_PATH,
} from "@/lib/settings-exec-digest-legacy-route";

/**
 * Traffic workbook row ID for the retired `/settings/exec-digest` bookmark.
 * Owner backlog shorthand: EEX.
 */
export const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID = "EEX";

/** Retired path tracked on the EEX workbook row. */
export const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH = RETIRED_SETTINGS_EXEC_DIGEST_PATH;

/** Workbook Section column value — retired Settings bookmark, not live product UX. */
export const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_SECTION = "Settings";

/**
 * Owner workbook Notes for EEX — documents pre-release retirement of the settings bookmark.
 */
export const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_NOTE =
  "Retired pre-release executive digest settings bookmark — no App Router page or next.config redirect (TB-1901–TB-1905). Canonical schedule UX on **DIS** (`/digests?tab=schedule`) via ExecDigestScheduleContent. Former workbook row SEX.";

/** Canonical Digests Schedule tab scored on traffic row DIS. */
export const CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH = CANONICAL_EXEC_DIGEST_SCHEDULE_PATH;

/** Removed traffic row ID — do not reintroduce. */
export const REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID = "SEX";
