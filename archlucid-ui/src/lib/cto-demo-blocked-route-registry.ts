import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

export type BlockedRouteEntry = { readonly prefix: string; readonly label: string; readonly description: string };

/** Core Pilot step 1 — reachable in packaged demos so empty-state CTAs and checklist links work. */
export const DEMO_ALLOWED_SETTINGS_PATHS = new Set<string>([`${SETTINGS_ROOT_PATH}/extract-upload`]);

export const CTO_DEMO_BLOCKED_ROUTES: readonly BlockedRouteEntry[] = [
  { prefix: SETTINGS_ROOT_PATH, label: "Settings", description: "Workspace preferences, API keys, and integration configuration." },
  { prefix: "/insights/search-review-evidence", label: EVIDENCE_TRAIL_SEARCH.title, description: "Search the evidence trail across reviews, findings, and decisions." },
  { prefix: "/internal/validate-route", label: "Validate review", description: "Check whether stored review output for a finalized package still validates." },
  { prefix: "/insights/improvement-planning", label: "Planning", description: "Multi-quarter approval roadmap and remediation scheduling." },
  { prefix: "/integrations", label: "Integrations", description: "Connect Jira, ServiceNow, Slack, and CI/CD pipelines. Native one-click ITSM ticket creation depends on deployment settings." },
  { prefix: IMPACT_PREVIEW_PATH, label: "Change simulation", description: "Preview the expected impact of proposed architecture changes before implementation." },
  { prefix: DIGESTS_HUB_PATH, label: "Digests", description: "Scheduled architecture digests and notification subscriptions." },
  { prefix: "/governance/advisory-scans", label: "Advisory scans", description: "Scheduled advisory scans and improvement recommendations." },
  { prefix: "/internal/product-learning", label: "Pilot feedback", description: "Feedback on review outputs and recurring improvement opportunities." },
  { prefix: "/internal/recommendation-learning", label: "Recommendation learning", description: "Inspect and rebuild recommendation-ranking profiles from historical review outcomes." },
  { prefix: "/internal", label: "Admin console", description: "Tenant configuration, user management, and system health monitoring." },
  { prefix: "/demo/explain", label: "Demo explain", description: "Internal demo explanation surfaces for engineering audiences." },
  { prefix: "/insights/compare-two-reviews", label: "Compare", description: "Side-by-side diff of two finalized reviews." },
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
