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
    exceptionReason: "Validate review package tool duplicated under Internal Ops for employee diagnostics (also in Operate analysis history).",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/health",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Public-style API health page linked from Internal Ops for support bundle context.",
  },
  {
    navGroupId: "operate-reports",
    href: "/digests",
    canonicalPrefixes: ["/scorecard", "/value-report"],
    exceptionReason: "Digest subscriptions hub uses a top-level route; promoted from Internal Ops to Reports (governance-digest theme, nav placement audit 2026-07-05).",
  },
];
