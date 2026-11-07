import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";

/** Traffic workbook path for path-chooser help (row HPX). */
export const PATH_CHOOSER_HELP_TRAFFIC_PATH = PATH_CHOOSER_HELP_PATH;
/**
 * Removed traffic workbook row ID for the retired `/help/evaluator-workbook` alias (merged into HPX).
 * Do not reintroduce — path-chooser help is scored only on HPX (`/help/choose-your-next-step`).
 */
export const REMOVED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_ROW_ID = "HEE";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_PATH = "/help/evaluator-workbook";

/** Canonical path-chooser help scored on traffic row HPX. */
export const CANONICAL_PATH_CHOOSER_HELP_TRAFFIC_PATH = PATH_CHOOSER_HELP_PATH;

/**
 * Historical workbook Notes for removed HEE (kept for owner note scripts / migration docs).
 * ASCII-only for Windows console note scripts.
 */
export const EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_NOTE =
  "No";
