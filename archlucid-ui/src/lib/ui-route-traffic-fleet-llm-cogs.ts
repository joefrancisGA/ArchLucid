import { FLEET_LLM_COGS_PATH } from "@/lib/fleet-llm-cogs-route";

/**
 * Traffic workbook row ID for Fleet LLM COGS.
 * Owner backlog shorthand: AFX.
 */
export const FLEET_LLM_COGS_TRAFFIC_ROW_ID = "AFX";

/** Canonical path tracked on the AFX workbook row. */
export const FLEET_LLM_COGS_TRAFFIC_PATH = FLEET_LLM_COGS_PATH;

/** Workbook Section column value — platform System Admin surface. */
export const FLEET_LLM_COGS_TRAFFIC_SECTION = "Admin";

/**
 * Owner workbook Notes for AFX — documents the fleet LLM COGS admin dashboard.
 */
export const FLEET_LLM_COGS_TRAFFIC_NOTE =
  "Platform admin fleet LLM COGS dashboard — FleetLlmCogsPageClient gated on AdminAuthority with per-tenant UTC-month estimated pressure, hard-cap utilization, gross-margin risk labels, and budget completeness table. GET /v1/admin/operational/fleet-llm-cogs via fetchAdminFleetLlmCogsDashboard. Internal COGS estimates only (not Azure invoice or customer charges). System Admin nav (features.showSystemAdministrationNav). route-readiness hidden.";
