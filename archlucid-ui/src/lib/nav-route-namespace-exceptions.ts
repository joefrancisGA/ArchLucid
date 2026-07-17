import type { NavRouteNamespaceException } from "@/lib/nav-route-namespace-policy";

/**
 * Intentional nav-group ↔ URL prefix mismatches until TB-408 canonical route moves land.
 * CI: `nav-route-namespace.test.ts`. Policy: `docs/NAV_CONFIG_CONTRACT.md` § Route namespace.
 */
export const NAV_ROUTE_NAMESPACE_EXCEPTIONS: readonly NavRouteNamespaceException[] = [
  {
    navGroupId: "operator-admin",
    href: "/integrations/readiness",
    canonicalPrefixes: ["/settings"],
    exceptionReason: "Connection status lives under Integrations routes; surfaced in Administration for tenant admins (TB-647 consolidation).",
  },
  {
    navGroupId: "operator-admin",
    href: "/health",
    canonicalPrefixes: ["/settings"],
    exceptionReason: "Buyer-safe system health dashboard uses a top-level route; grouped under Administration for tenant admins.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/operate/integration-events/dlq",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Integration dead-letter tooling uses operate namespace pending Internal Ops route consolidation (TB-408).",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/replay",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Validate review tool duplicated under Internal Ops for employee diagnostics (also in Operate analysis history).",
  },
  {
    navGroupId: "operate-reports",
    href: "/digests",
    canonicalPrefixes: ["/scorecard", "/value-report"],
    exceptionReason: "Digest subscriptions hub uses a top-level route; promoted from Internal Ops to Reports (governance-digest theme, nav placement audit 2026-07-05).",
  },
  {
    navGroupId: "operate-governance",
    href: "/advisory",
    canonicalPrefixes: ["/governance"],
    exceptionReason: "Architecture advisory hub uses a top-level route; grouped under Enterprise governance until TB-408 canonical route consolidation.",
  },
  {
    navGroupId: "operate-governance",
    href: "/signed-records",
    canonicalPrefixes: ["/governance"],
    exceptionReason: "Signed review records use a top-level route; grouped under Enterprise governance until TB-408.",
  },
];
