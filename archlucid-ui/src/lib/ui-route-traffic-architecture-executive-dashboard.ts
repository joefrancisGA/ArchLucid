import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

/**
 * Traffic workbook row ID for the canonical sponsor dashboard App Router page.
 * Owner backlog shorthand: ARE.
 */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID = "ARE";

/** Canonical path tracked on the ARE workbook row. */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_PATH = SPONSOR_DASHBOARD_HREF;

/** Workbook Section column value — sponsor portfolio surface, not marketing. */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_SECTION = "Sponsor";

/**
 * Owner workbook Notes for ARE - documents Evidence chrome on the sponsor ROI dashboard.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_NOTE =
  "Sponsor ROI portfolio dashboard (Sponsor) - SponsorRoiDashboardPageView with PageContextualHelpButton (topic map sponsor-report; Category-1 registry), hero, KPI tiles, trend charts, sponsor exports, board-pack evidence posture, workspace-health KPI section (merged former GDX). Absorbs retired ESX `/sponsor/scorecard` sponsor scorecard bookmark. Legacy /dashboard (DSH), /sponsor/dashboard (EXD), /portfolio, `/governance/dashboard`, and `/sponsor/scorecard` bookmarks are hard-retired (host-gate 404). Sibling SCX = scorecard; ASK = ask-review-questions. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - portfolio ROI launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.";

/** Legacy operator bookmark merged onto ARE during sponsor dashboard consolidation. */
export const LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH = "/dashboard";

/** Legacy sponsor-shell bookmark merged onto ARE (TB-608). */
export const LEGACY_SPONSOR_SHELL_DASHBOARD_PATH = "/sponsor/dashboard";

/** Retired portfolio overview bookmark merged onto ARE. */
export const LEGACY_PORTFOLIO_OVERVIEW_PATH = "/portfolio";
