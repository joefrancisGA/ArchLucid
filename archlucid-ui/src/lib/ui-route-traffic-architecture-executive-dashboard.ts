import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

/**
 * Traffic workbook row ID for the canonical executive dashboard App Router page.
 * Owner backlog shorthand: ARE.
 */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID = "ARE";

/** Canonical path tracked on the ARE workbook row. */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_PATH = EXECUTIVE_DASHBOARD_HREF;

/** Workbook Section column value — executive portfolio surface, not marketing. */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for ARE — documents the live executive ROI dashboard.
 */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_NOTE =
  "Canonical executive ROI portfolio dashboard — ExecutiveRoiDashboardPageView with hero, KPI tiles, trend charts, sponsor exports, workspace-health KPI section (merged former GDX), and PageContextualHelp → executive-summary. Absorbs retired ESX `/executive/scorecard` sponsor scorecard bookmark. Legacy /dashboard (DSH), /executive/dashboard (EXD), /portfolio, `/governance/dashboard`, and `/executive/scorecard` bookmarks are hard-retired (host-gate 404).";

/** Legacy operator bookmark merged onto ARE during executive dashboard consolidation. */
export const LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH = "/dashboard";

/** Legacy executive-shell bookmark merged onto ARE (TB-608). */
export const LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH = "/executive/dashboard";

/** Retired portfolio overview bookmark merged onto ARE. */
export const LEGACY_PORTFOLIO_OVERVIEW_PATH = "/portfolio";
