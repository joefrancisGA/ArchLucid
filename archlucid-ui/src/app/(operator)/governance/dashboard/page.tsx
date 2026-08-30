import { redirect } from "next/navigation";

import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

/** Legacy bookmark shim — workspace health KPIs live on Insights. */
export default function GovernanceDashboardPage() {
  redirect(WORKSPACE_HEALTH_PATH);
}
