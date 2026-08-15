/**
 * TB-1596 — Guard against reintroducing retired `/governance/alerts?tab=inbox` product deep links.
 *
 * Bare `/governance/alerts` is the canonical inbox (**TB-1594**). Legacy `?tab=inbox` still
 * canonicalizes in `governance/alerts/page.tsx`, but new product hrefs must not emit it.
 */

export const RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF = "/governance/alerts?tab=inbox" as const;

/** Source files that may reference the retired href for redirects, tests, or traffic bookkeeping. */
export const ALERTS_INBOX_TAB_DEEP_LINK_GUARD_ALLOWLIST: readonly string[] = [
  "lib/alerts-inbox-tab-deep-link-guard.ts",
  "lib/alerts-inbox-tab-deep-link-guard.test.ts",
  "lib/alerts-hub-tab.ts",
  "lib/alerts-hub-tab.test.ts",
  "lib/governance/governance-alerts-inbox-legacy-route.test.ts",
  "lib/governance/governance-route-paths.ts",
  "lib/governance/governance-route-paths.test.ts",
  "lib/legacy-alerts-inbox-tab-route-doc-guard.test.ts",
  "lib/ui-route-traffic-alerts-inbox-tab.ts",
  "lib/ui-route-traffic-alerts-inbox-tab.test.ts",
  "app/(operator)/governance/alerts/page.tsx",
  "app/(operator)/governance/alerts/page.test.tsx",
] as const;

export const ALERTS_INBOX_TAB_DEEP_LINK_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /\?tab=inbox\b/,
  /\/governance\/alerts\?tab=inbox/,
];

export function findAlertsInboxTabDeepLinkViolations(source: string): readonly string[] {
  const violations: string[] = [];

  for (const pattern of ALERTS_INBOX_TAB_DEEP_LINK_FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      violations.push(pattern.source);
    }
  }

  return violations;
}
