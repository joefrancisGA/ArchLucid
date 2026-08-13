import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";

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
  "Architecture scorecard (Insights) - PilotScorecardPageView with PageContextualHelp (topic map sponsor-report#pilot-roi-measurement + Category-1 registry), Outcomes nav, empty CTAs (TB-1958), sample-mode honesty (TB-1957). Hierarchy polish: savings hero, primary finalized/governance tiles, operational metrics section, empty-state dashes (not large zeros), ROI calculator + estimate side-by-side, stronger Outcomes active tab. Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect). Sibling ARE = sponsor-dashboard. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - aggregate KPI launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";

/** Workbook Section column value. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_SECTION = "Insights";
