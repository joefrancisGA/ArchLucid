import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance/governance-route-paths";

/** True when the operator shell footer renders deployment build fingerprint chrome for this route. */
export function isAppShellWorkspaceFooterBuildFingerprintVisible(pathname: string): boolean {
  const hideWorkspaceHealthFooter =
    pathname === "/"
    || pathname.startsWith("/help")
    || pathname.startsWith("/insights/evidence-graph")
    || pathname.startsWith("/insights/ask-review-questions")
    || pathname.startsWith("/governance")
    || pathMatchesGovernanceAudit(pathname)
    || pathMatchesGovernanceAlerts(pathname)
    || pathMatchesGovernancePolicyPacks(pathname)
    || (pathname.startsWith("/architecture/reviews/") && pathname.split("/").filter(Boolean).length >= 2);

  if (isBuyerPolishedOperatorShellEnv()) {
    return !hideWorkspaceHealthFooter;
  }

  if (isNextPublicDemoMode() || hideWorkspaceHealthFooter) {
    return false;
  }

  return true;
}
