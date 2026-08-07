import { GOVERNANCE_DASHBOARD_PATH } from "@/lib/governance-route-paths";

/**
 * Traffic workbook row ID for Executive Workspace Health dashboard.
 * Owner backlog shorthand: GDX.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID = "GDX";

/** Canonical path tracked on the GDX workbook row. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_PATH = GOVERNANCE_DASHBOARD_PATH;

/** Workbook Section column value — Alerts/gov, not marketing. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for GDX — documents the live workspace-health dashboard surface.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_NOTE =
  "Retired standalone page — workspace-health KPIs merged onto ARE (`/architecture/executive-dashboard#workspace-health`). App Router shim at `/governance/dashboard` redirects; hit share absorbed by ARE.";
