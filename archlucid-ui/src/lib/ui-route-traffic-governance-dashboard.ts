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
  "Executive Workspace Health dashboard - ExecutiveWorkspaceHealthDashboard with hero PageContextualHelp (Learn more omitted — no workspace-health specialty; TB-2050; not governance-approval), Category-1 registry, Sources follow-up strip + claim-discipline callout (scoped aggregates / planning hours, not diligence trail), DecisionsNeededSummaryCard, five KPI tiles, Bypass audit panel. Alerts topic-map honesty sibling (`/governance/alerts` -> alerts). TB-1668 GDX/alerts topic slice. Demo shell may still redirect away (BDA-107). Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication.";
