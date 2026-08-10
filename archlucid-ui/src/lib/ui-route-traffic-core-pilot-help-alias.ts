import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";

/**
 * Removed traffic workbook row ID for the retired `/help/core-pilot` alias (merged into COR).
 * Do not reintroduce — first-architecture-review help is scored only on COR.
 */
export const REMOVED_CORE_PILOT_HELP_ALIAS_TRAFFIC_ROW_ID = "ECO";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH = "/help/core-pilot";

/** Canonical first-architecture-review help scored on traffic row COR. */
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;

/**
 * Historical workbook Notes for removed ECO (kept for owner note scripts / migration docs).
 * ASCII-only for Windows console note scripts.
 */
export const CORE_PILOT_HELP_ALIAS_TRAFFIC_NOTE =
  "Deprecated core-pilot help alias (Help alias) - slug alias core-pilot -> first-architecture-review; renders HelpCorePilotGuideView Evidence chrome (Sources strip + claim-discipline + PageContextualHelp + Category-1 on alias path). Canon COR = /help/first-architecture-review. Body lives in CORE_PILOT.md. Sibling HFE/FIR = other COR aliases. Score 52/100 (2026-08-07) - help-topic orientation hard-caps higher Evidence (alias inherits COR).";
