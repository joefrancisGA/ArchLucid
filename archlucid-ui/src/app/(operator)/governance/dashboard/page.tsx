import { redirect } from "next/navigation";
import { ExecutiveWorkspaceHealthDashboard } from "@/components/ExecutiveWorkspaceHealthDashboard";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/**
 * Executive Workspace Health — `/governance/dashboard` — five KPI tiles from existing APIs in the active SESSION_CONTEXT only.
 */
export default function GovernanceDashboardPage() {
  if (
    (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) &&
    !isBuyerPolishedOperatorShellEnv()
  ) {
    redirect("/governance");
  }

  return <ExecutiveWorkspaceHealthDashboard />;
}
