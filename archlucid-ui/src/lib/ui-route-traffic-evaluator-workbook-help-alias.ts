import { PATH_CHOOSER_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-path-chooser-help";

/**
 * Removed traffic workbook row ID for the retired `/help/evaluator-workbook` alias (merged into HPX).
 * Do not reintroduce — path-chooser help is scored only on HPX (`/help/path-chooser`).
 */
export const REMOVED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_ROW_ID = "HEE";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_PATH = "/help/evaluator-workbook";

/** Canonical path-chooser help scored on traffic row HPX. */
export const CANONICAL_PATH_CHOOSER_HELP_TRAFFIC_PATH = PATH_CHOOSER_HELP_TRAFFIC_PATH;

/**
 * Historical workbook Notes for removed HEE (kept for owner note scripts / migration docs).
 * ASCII-only for Windows console note scripts.
 */
export const EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_NOTE =
  "Deprecated evaluator-workbook help alias (Help alias) - slug alias evaluator-workbook -> path-chooser; renders HelpPathChooserGuideView Evidence chrome (Sources strip + claim-discipline + PageContextualHelp + Category-1 on alias path). Canon HPX = /help/path-chooser. Pass/hold body lives in BUYER_ORIENTATION_ONE_SCREEN.md. Score 58/100 (2026-08-05) - help-topic orientation hard-caps higher Evidence (alias inherits HPX). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.";
