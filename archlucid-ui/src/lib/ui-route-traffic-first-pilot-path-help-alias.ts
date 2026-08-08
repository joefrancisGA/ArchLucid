import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/**
 * Traffic workbook row ID for the legacy first-pilot-path help bookmark.
 * Owner backlog shorthand: FIR.
 */
export const FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "FIR";

/** Legacy alias path tracked on the FIR workbook row. */
export const FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_PATH = "/help/first-pilot-path";

/** Canonical first-review help path that FIR resolves to (workbook row COR). */
export const FIRST_PILOT_PATH_HELP_ALIAS_CANONICAL_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/** Workbook Section column value Ã¢â‚¬â€ deprecated help alias, not a separate topic. */
export const FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_SECTION = "Help alias";

/**
 * Owner workbook Notes for FIR Ã¢â‚¬â€ documents the legacy slug alias bookmark.
 */
export const FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_NOTE =
 "Deprecated first-pilot-path help alias (Help alias) - slug alias first-pilot-path -> first-architecture-review; renders HelpCorePilotGuideView Evidence chrome (Sources strip + PageContextualHelp + Category-1 on alias path). Canon COR = /help/first-architecture-review. Body lives in CORE_PILOT.md#complete-review-workflow (TB-1379). Score 58/100 (2026-08-05) - help-topic orientation hard-caps higher Evidence (alias inherits COR). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
