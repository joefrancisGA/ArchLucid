import { SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

/**
 * Traffic workbook row ID for Sponsor Workspace Health dashboard.
 * Owner backlog shorthand: GDX.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID = "GDX";

/** Retired standalone path — KPIs live on ARE (#workspace-health). */
export const GOVERNANCE_DASHBOARD_TRAFFIC_PATH = "/governance/dashboard";

/** Workbook Section column value — Alerts/gov, not marketing. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for GDX — documents the retired workspace-health bookmark.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_NOTE =
 "Retired standalone page — workspace-health KPIs merged onto ARE (`/architecture/sponsor-dashboard#workspace-health`). Legacy `/governance/dashboard` bookmark hard-retired (host-gate 404); hit share absorbed by ARE.";

/** Canonical in-app destination for GDX traffic attribution. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_CANONICAL_HREF = SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF;
