import { redirect } from "next/navigation";
import { ExecutiveWorkspaceHealthDashboard } from "@/components/ExecutiveWorkspaceHealthDashboard";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/**
 * Executive Workspace Health — `/governance/dashboard` — five KPI tiles from existing APIs in the active SESSION_CONTEXT only.
 */
export default function GovernanceDashboardPage() {
  if (
    (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) &&
    isOperatorExperienceFullShellEnv()
  ) {
    redirect(GOVERNANCE_APPROVAL_QUEUE_PATH);
  }

  return <ExecutiveWorkspaceHealthDashboard />;
}
