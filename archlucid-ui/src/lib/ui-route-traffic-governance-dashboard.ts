import {
  LEGACY_GOVERNANCE_DASHBOARD_PATH,
  LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH,
  WORKSPACE_HEALTH_PATH,
} from "@/lib/workspace-health-route";

/**
 * Traffic workbook metadata for workspace health (owner shorthand: GDX).
 *
 * `GOVERNANCE_DASHBOARD_TRAFFIC_PATH` is the retired `/governance/dashboard` bookmark used for
 * attribution of legacy inbound links; canonical routing lives at {@link WORKSPACE_HEALTH_PATH}
 * via {@link GOVERNANCE_DASHBOARD_TRAFFIC_CANONICAL_HREF}.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID = "GDX";

/** Retired bookmark path — not the canonical page; redirects to {@link WORKSPACE_HEALTH_PATH}. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_PATH = LEGACY_GOVERNANCE_DASHBOARD_PATH;

/** Workbook Section column value — Alerts/gov, not marketing. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for GDX — documents the restored standalone workspace-health page.
 */
export const GOVERNANCE_DASHBOARD_TRAFFIC_NOTE =
  `Standalone workspace health KPIs at \`${WORKSPACE_HEALTH_PATH}\`. Legacy \`${LEGACY_GOVERNANCE_DASHBOARD_PATH}\` and sponsor-dashboard \`#${LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH}\` bookmarks redirect here.`;

/** Canonical in-app destination for GDX traffic attribution. */
export const GOVERNANCE_DASHBOARD_TRAFFIC_CANONICAL_HREF = WORKSPACE_HEALTH_PATH;
