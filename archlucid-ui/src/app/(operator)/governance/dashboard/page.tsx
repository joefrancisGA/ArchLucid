import { redirect } from "next/navigation";

import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive-dashboard-route";

/**
 * Legacy bookmark shim — workspace health KPIs live on the executive dashboard.
 */
export default function GovernanceDashboardPage() {
  redirect(EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF);
}
