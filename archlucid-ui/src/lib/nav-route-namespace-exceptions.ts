import type { NavRouteNamespaceException } from "@/lib/nav-route-namespace-policy";

/**
 * Intentional nav-group ↔ URL prefix mismatches.
 * CI: `nav-route-namespace.test.ts`. Policy: `docs/NAV_CONFIG_CONTRACT.md` § Route namespace.
 */
export const NAV_ROUTE_NAMESPACE_EXCEPTIONS: readonly NavRouteNamespaceException[] = [
  {
    navGroupId: "operate-governance",
    href: "/architecture/executive-dashboard#workspace-health",
    canonicalPrefixes: ["/governance"],
    exceptionReason:
      "Workspace-health KPIs live on the executive dashboard hash anchor rather than a /governance/* route.",
  },
];
