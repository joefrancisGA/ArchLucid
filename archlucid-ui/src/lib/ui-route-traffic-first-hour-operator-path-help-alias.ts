import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/**
 * Traffic workbook row ID for the legacy first-hour-operator-path help bookmark.
 * Owner backlog shorthand: HFE.
 */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "HFE";

/** Legacy alias path tracked on the HFE workbook row. */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_PATH = "/help/first-hour-operator-path";

/** Canonical first-review help path that HFE resolves to (workbook row COR). */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_CANONICAL_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/** Workbook Section column value - deprecated help alias, not a separate topic. */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_SECTION = "Help alias";

/**
 * Owner workbook Notes for HFE - documents the legacy slug alias bookmark.
 * ASCII-only for Windows console note scripts.
 */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_NOTE =
  "Deprecated first-hour-operator-path help alias (Help alias) - slug alias first-hour-operator-path -> first-architecture-review; renders HelpCorePilotGuideView Evidence chrome (Sources strip + PageContextualHelp + Category-1 on alias path). Canon COR = /help/first-architecture-review. Body lives in CORE_PILOT.md (TB-1374). Score 52/100 (2026-08-05) - help-topic orientation hard-caps higher Evidence (alias inherits COR).";
