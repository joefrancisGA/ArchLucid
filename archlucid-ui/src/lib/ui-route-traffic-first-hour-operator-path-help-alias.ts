import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";

/**
 * Removed traffic workbook row ID for the retired `/help/first-hour-operator-path` alias (merged into COR).
 * Do not reintroduce — first-architecture-review help is scored only on COR.
 */
export const REMOVED_FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "HFE";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_PATH =
  "/help/first-hour-operator-path";

/** Canonical first-architecture-review help scored on traffic row COR. */
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;

/**
 * Historical workbook Notes for removed HFE (kept for owner note scripts / migration docs).
 * ASCII-only for Windows console note scripts.
 */
export const FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_NOTE =
  "Deprecated first-hour-operator-path help alias (Help alias) - slug alias first-hour-operator-path -> first-architecture-review; renders HelpCorePilotGuideView Evidence chrome (Sources strip + PageContextualHelp + Category-1 on alias path). Canon COR = /help/first-architecture-review. Body lives in CORE_PILOT.md (TB-1374). Score 58/100 (2026-08-05) - help-topic orientation hard-caps higher Evidence (alias inherits COR). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
