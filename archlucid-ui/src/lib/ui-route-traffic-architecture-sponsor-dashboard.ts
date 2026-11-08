import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

/**
 * Traffic workbook row ID for the canonical sponsor dashboard App Router page.
 * Owner backlog shorthand: ARE.
 */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID = "DSH";

/** Canonical path tracked on the ARE workbook row. */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_PATH = SPONSOR_DASHBOARD_HREF;

/** Workbook Section column value — sponsor portfolio surface, not marketing. */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_SECTION = "Sponsor";

/**
 * Owner workbook Notes for ARE - documents Evidence chrome on the sponsor ROI dashboard.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_NOTE =
  "None";

/** Legacy /dashboard bookmark — hard-retired (host-gate 404); merged onto DSH during sponsor dashboard consolidation. */
export const LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH = "/dashboard";

/** Legacy /sponsor/dashboard bookmark — hard-retired (host-gate 404); TB-608. */
export const LEGACY_SPONSOR_SHELL_DASHBOARD_PATH = "/sponsor/dashboard";

/** Legacy /portfolio overview bookmark — hard-retired (host-gate 404); merged onto DSH. */
export const LEGACY_PORTFOLIO_OVERVIEW_PATH = "/portfolio";
