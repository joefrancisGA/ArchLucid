import type { NavRouteNamespaceException } from "@/lib/nav-route-namespace-policy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance-route-paths";

/**
 * Intentional nav-group ↔ URL prefix mismatches.
 * CI: `nav-route-namespace.test.ts`. Policy: `docs/NAV_CONFIG_CONTRACT.md` § Route namespace.
 */
export const NAV_ROUTE_NAMESPACE_EXCEPTIONS: readonly NavRouteNamespaceException[] = [
  {
    navGroupId: "operate-governance",
    href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
    canonicalPrefixes: ["/governance"],
    exceptionReason:
      "Workspace health KPIs were merged onto the executive dashboard when standalone /governance/dashboard was retired, "
      + "so the governance nav row deep-links to the #workspace-health anchor instead of owning a /governance/* page.",
  },
];
