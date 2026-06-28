import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { NavRouteNamespaceException } from "@/lib/nav-route-namespace-policy";

/**
 * Intentional nav-group ↔ URL prefix mismatches until TB-405–408 canonical route moves land.
 * CI: `nav-route-namespace.test.ts`. Policy: `docs/NAV_CONFIG_CONTRACT.md` § Route namespace.
 */
export const NAV_ROUTE_NAMESPACE_EXCEPTIONS: readonly NavRouteNamespaceException[] = [
  {
    navGroupId: "operate-reports",
    href: "/governance/first-30-days",
    canonicalPrefixes: ["/scorecard", "/value-report"],
    exceptionReason:
      "First-30-days governance adoption report lives under governance URL tree while grouped under Reports for buyer narrative.",
  },
  {
    navGroupId: "operate-integrations",
    href: CLOUD_CONNECTIONS_PATH,
    canonicalPrefixes: ["/integrations"],
    exceptionReason:
      "Tier 2 cloud connection management shares settings App Router tree with tenant settings; surfaced under Integrations for evidence-source mental model.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/operate/integration-events/dlq",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Integration dead-letter tooling uses operate namespace pending Internal Ops route consolidation (TB-408).",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/recommendation-learning",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Employee-only recommendation tuning surface; top-level route until Internal Ops aliases (TB-408).",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/product-learning",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Employee-only pilot feedback analytics; top-level route until Internal Ops aliases (TB-408).",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/planning",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Improvement planning hub remains top-level while Operate analysis owns buyer-facing compare/advisory paths.",
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
    navGroupId: "operator-system-admin",
    href: "/digests",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Digest subscriptions hub uses top-level route shared with Operate reporting workflows.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/value-report/pilot",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Internal pilot value report variant; shares /value-report tree with Reports nav.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/value-report/roi",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Internal ROI report variant; shares /value-report tree with Reports nav.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/settings/identity-providers",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "Identity catalog read surface uses settings App Router segment for SSO configuration parity.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/settings/identity/sso-wizard",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "SSO wizard lives under settings identity tree; gated to Internal Ops nav for platform operators.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/settings/api-keys",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "API key rotation UI uses settings segment; employee-only until tenant admin promotion decision.",
  },
  {
    navGroupId: "operator-system-admin",
    href: "/settings/scim-provisioning",
    canonicalPrefixes: ["/admin"],
    exceptionReason: "SCIM provisioning UI uses settings segment; employee-only until tenant admin promotion decision.",
  },
];
