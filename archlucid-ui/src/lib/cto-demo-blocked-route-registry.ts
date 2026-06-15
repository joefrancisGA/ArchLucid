export type BlockedRouteEntry = { readonly prefix: string; readonly label: string; readonly description: string };

/** Core Pilot step 1 — reachable in packaged demos so empty-state CTAs and checklist links work. */
export const DEMO_ALLOWED_SETTINGS_PATHS = new Set<string>(["/settings/extract-upload"]);

export const CTO_DEMO_BLOCKED_ROUTES: readonly BlockedRouteEntry[] = [
  { prefix: "/admin", label: "Admin console", description: "Tenant configuration, user management, and system health monitoring." },
  { prefix: "/settings", label: "Settings", description: "Workspace preferences, API keys, and integration configuration." },
  { prefix: "/search", label: "Search", description: "Full-text search across all review packages, findings, and decisions." },
  { prefix: "/replay", label: "Replay", description: "Re-run any historical review with updated policy packs to track improvement." },
  { prefix: "/planning", label: "Planning", description: "Multi-quarter governance roadmap and remediation scheduling." },
  { prefix: "/integrations", label: "Integrations", description: "Connect Jira, ServiceNow, Slack, and CI/CD pipelines (V1.1)." },
  { prefix: "/evolution-review", label: "Evolution candidates", description: "Trend analysis of recurring findings across review packages." },
  { prefix: "/digests", label: "Digests", description: "Scheduled governance digests and notification subscriptions." },
  { prefix: "/advisory", label: "Advisory", description: "Architecture advisory scheduling and expert review workflows." },
  { prefix: "/product-learning", label: "Product learning", description: "Feedback loops and recommendation tuning for your tenant." },
  { prefix: "/recommendation-learning", label: "Recommendation tuning", description: "Calibrate recommendation thresholds for your organization." },
  { prefix: "/demo/explain", label: "Demo explain", description: "Internal demo explanation surfaces for engineering audiences." },
  { prefix: "/compare", label: "Compare", description: "Side-by-side diff of two finalized review packages." },
  { prefix: "/users", label: "Users & roles", description: "Role-based access control and authority assignment." },
  { prefix: "/billing", label: "Billing", description: "Subscription management and usage reporting." },
];

export function findBlockedRouteEntry(pathname: string): BlockedRouteEntry | null {
  const normalized = pathname.trim();
  if (normalized.length === 0) return null;

  if (DEMO_ALLOWED_SETTINGS_PATHS.has(normalized)) {
    return null;
  }

  for (const entry of CTO_DEMO_BLOCKED_ROUTES) {
    if (normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`)) return entry;
  }
  return null;
}

export function resolveDemoBlockedRoutePanel(pathname: string): BlockedRouteEntry {
  return findBlockedRouteEntry(pathname) ?? { prefix: "", label: "This page", description: "This area is available in a provisioned ArchLucid tenant." };
}
