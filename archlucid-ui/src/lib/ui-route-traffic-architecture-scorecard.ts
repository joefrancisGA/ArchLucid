import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";

/** Traffic workbook row ID for architecture scorecard. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_ROW_ID = "SCX";

/** Canonical browser path for the architecture scorecard. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_PATH = ARCHITECTURE_SCORECARD_PATH;

/**
 * Owner workbook Notes for SCX - Insights surface with Evidence chrome.
 * ASCII-only for Windows console note scripts.
 * Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect).
 */
export const ARCHITECTURE_SCORECARD_TRAFFIC_NOTE =
 "Architecture scorecard (Insights) - PilotScorecardPageView with PageContextualHelp (Architecture scorecard label; Learn more pilot-roi-model), shared Insights Outcomes strip, related ROI/Baseline/Workspace health links, empty CTA hero to #roi-assumptions, live ROI preview before save, deep-linked KPI tiles, deduped operational metrics, claim-discipline note, scope cue, form validation (TB-2005). Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect). Sibling ARE = executive-dashboard. Not a signed-record Sources trail. Score 68/100 (2026-08-09) - aggregate KPI launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";

/** Workbook Section column value. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_SECTION = "Insights";
