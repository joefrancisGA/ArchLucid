import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";

/** Traffic workbook row ID for architecture scorecard. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_ROW_ID = "SCX";

/** Canonical browser path for the architecture scorecard. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_PATH = ARCHITECTURE_SCORECARD_PATH;

/**
 * Owner workbook Notes for SCX — Insights surface.
 * Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect).
 */
export const ARCHITECTURE_SCORECARD_TRAFFIC_NOTE =
  "Architecture scorecard (Insights) - PilotScorecardPageView with PageContextualHelp (topic map pilot-roi-model + Category-1 registry), Sources follow-up strip + claim-discipline callout (directional ROI / not financial reporting; not diligence trail), Outcomes nav, empty CTAs (TB-1958), sample-mode honesty (TB-1957). Hierarchy polish: savings hero, primary finalized/governance tiles, operational metrics section, empty-state dashes (not large zeros), ROI calculator + estimate side-by-side, stronger Outcomes active tab. Formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired; no redirect). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 68/100 (2026-08-03) — value hierarchy improved; still aggregate KPI launcher without trends/diligence packing.";

/** Workbook Section column value. */
export const ARCHITECTURE_SCORECARD_TRAFFIC_SECTION = "Insights";
