import type { NavRouteNamespaceException } from "@/lib/nav-route-namespace-policy";

/**
 * Intentional nav-group ↔ URL prefix mismatches until TB-408 canonical route moves land.
 * CI: `nav-route-namespace.test.ts`. Policy: `docs/NAV_CONFIG_CONTRACT.md` § Route namespace.
 */
export const NAV_ROUTE_NAMESPACE_EXCEPTIONS: readonly NavRouteNamespaceException[] = [
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
    navGroupId: "operator-system-admin",
    href: "/internal-operations/recommendation-learning",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Recommendation learning ops surface uses Internal Ops namespace; grouped under System admin for employee operators (TB-408 pending).",
  },
  {
    navGroupId: "operate-reports",
    href: "/digests",
    canonicalPrefixes: ["/sponsor-report"],
    exceptionReason: "Digest subscriptions hub uses a top-level route; promoted from Internal Ops to Reports (governance-digest theme, nav placement audit 2026-07-05).",
  },
  {
    navGroupId: "operate-governance",
    href: "/signed-records",
    canonicalPrefixes: ["/governance"],
    exceptionReason: "Signed review records use a top-level route; grouped under Enterprise governance until TB-408.",
  },
];
