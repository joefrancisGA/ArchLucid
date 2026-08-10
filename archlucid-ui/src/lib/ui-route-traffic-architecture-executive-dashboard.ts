import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

/**
 * Traffic workbook row ID for the canonical executive dashboard App Router page.
 * Owner backlog shorthand: ARE.
 */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID = "ARE";

/** Canonical path tracked on the ARE workbook row. */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_PATH = EXECUTIVE_DASHBOARD_HREF;

/** Workbook Section column value — executive portfolio surface, not marketing. */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_SECTION = "Executive";

/**
 * Owner workbook Notes for ARE - documents Evidence chrome on the executive ROI dashboard.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_NOTE =
  "Executive ROI portfolio dashboard (Executive) - ExecutiveRoiDashboardPageView with PageContextualHelpButton (topic map executive-summary; Category-1 registry), hero, KPI tiles, trend charts, sponsor exports, board-pack evidence posture, workspace-health KPI section (merged former GDX). Absorbs retired ESX `/executive/scorecard` sponsor scorecard bookmark. Legacy /dashboard (DSH), /executive/dashboard (EXD), /portfolio, `/governance/dashboard`, and `/executive/scorecard` bookmarks are hard-retired (host-gate 404). Sibling SCX = scorecard; ASK = ask-review-questions. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - portfolio ROI launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";

/** Legacy operator bookmark merged onto ARE during executive dashboard consolidation. */
export const LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH = "/dashboard";

/** Legacy executive-shell bookmark merged onto ARE (TB-608). */
export const LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH = "/executive/dashboard";

/** Retired portfolio overview bookmark merged onto ARE. */
export const LEGACY_PORTFOLIO_OVERVIEW_PATH = "/portfolio";
