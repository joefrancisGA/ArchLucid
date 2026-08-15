/**
 * Product-facing readiness tiers for operator routes (nav gating, demo shell copy).
 * API policy and `[Authorize]` remain authoritative; this is UX-only.
 */
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { PLANNING_PATH } from "@/lib/planning-route";
import { DIGESTS_HUB_PATH, LEGACY_DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";

export type RouteReadinessTier = "demo-ready" | "advanced-only" | "admin-only" | "hidden";

export const OPERATOR_ROUTE_READINESS_LIVE_PATHS: Readonly<Record<string, RouteReadinessTier>> = {
  "/": "demo-ready",
  "/architecture/first-review-guide": "demo-ready",
  "/architecture/reviews/new": "demo-ready",
  "/architecture/reviews": "demo-ready",
  "/help": "demo-ready",
  "/insights/ask-review-questions": "demo-ready",
  "/insights/search-review-evidence": "demo-ready",
  [ARCHITECTURE_SCORECARD_PATH]: "demo-ready",
  [SPONSOR_DASHBOARD_HREF]: "demo-ready",
  "/governance/findings": "advanced-only",
  "/administration/security-trust": "demo-ready",
  "/account/preferences": "demo-ready",
  "/insights/sponsor-report": "advanced-only",
  "/insights/roi-summary": "advanced-only",
  [EVIDENCE_GRAPH_PATH]: "advanced-only",
  [COMPARE_TWO_REVIEWS_PATH]: "advanced-only",
  "/internal/validate-route": "advanced-only",
  "/governance/advisory-scans": "advanced-only",
  [PLANNING_PATH]: "advanced-only",
  [DIGESTS_HUB_PATH]: "advanced-only",
  [LEGACY_DIGESTS_HUB_PATH]: "advanced-only",
  [IMPACT_PREVIEW_PATH]: "advanced-only",
  "/integrations/teams": "advanced-only",
  "/integrations/cloud-connections": "admin-only",
  "/integrations/slack": "advanced-only",
  "/integrations/jira": "admin-only",
  "/integrations/azure-boards": "admin-only",
  "/integrations/servicenow": "admin-only",
  "/integrations/webhooks": "advanced-only",
  "/administration/connection-status": "advanced-only",
  "/administration/ai-usage": "admin-only",
  "/settings/cost-reporting": "admin-only",
  "/governance/setup": "advanced-only",
  [GOVERNANCE_APPROVAL_QUEUE_PATH]: "advanced-only",
  [GOVERNANCE_STANDARDS_AND_RULES_PATH]: "advanced-only",
  "/governance/policy-packs": "advanced-only",
  "/governance/audit": "advanced-only",
  "/governance/alerts": "advanced-only",
  "/governance/alert-rules": "advanced-only",
  "/administration/system-health": "demo-ready",
  "/demo/explain": "hidden",

  "/internal/product-learning": "advanced-only",
  "/internal/recommendation-learning": "advanced-only",
  "/internal/health": "admin-only",
  "/internal/deployment-status": "admin-only",
  "/internal/configuration": "admin-only",
  "/internal/pricing-quote-aging": "hidden",
  "/internal/trial-funnel": "admin-only",
  "/internal/fleet-llm-cogs": "hidden",
  "/internal/tenants": "hidden",
  "/internal/tenant-health": "hidden",
  "/admin/support": "admin-only",
  "/admin/users": "admin-only",
  "/administration/support": "admin-only",
  "/administration/users": "admin-only",
  "/administration/workspace-settings": "admin-only",
  "/administration/workspace-settings/recycle-bin": "admin-only",
  "/administration/baseline": "advanced-only",
  "/administration/developer": "advanced-only",
  "/administration/billing": "advanced-only",
  "/settings/webhooks": "advanced-only",
  "/settings/roles": "admin-only",
  "/administration/api-keys": "hidden",
};

/**
 * Resolves readiness for a sidebar or deep link `href` (strips query except projectId on `/architecture/reviews` list).
 */
export function operatorRouteReadiness(href: string): RouteReadinessTier {
  const [path, query] = href.split("?", 2);

  if (path === "/architecture/reviews" && query !== undefined && query.includes("projectId=")) {
    const fromTable = OPERATOR_ROUTE_READINESS_LIVE_PATHS["/architecture/reviews"];

    return fromTable ?? "demo-ready";
  }

  const canonicalPath = canonicalizeLegacyOperatorRoutePath(path.trim().length === 0 ? "/" : path);
  const trimmedPath = readinessLookupPath(canonicalPath);

  if (trimmedPath.startsWith("/governance/approval-requests")) {
    return "admin-only";
  }

  const exact = OPERATOR_ROUTE_READINESS_LIVE_PATHS[href] ?? OPERATOR_ROUTE_READINESS_LIVE_PATHS[trimmedPath];

  if (exact !== undefined) {
    return exact;
  }

  return "demo-ready";
}

function readinessLookupPath(canonicalPath: string): string {
  const withoutHash = canonicalPath.split("#")[0] ?? canonicalPath;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;

  return withoutQuery.length === 0 ? "/" : withoutQuery;
}

/**
 * Advanced routes that stay visible in `NEXT_PUBLIC_DEMO_MODE` nav (sidebar + mobile), alongside core pilot links.
 * Curated static samples exist for policy packs and alerts so evaluators can open them without a seeded API.
 */
const DEMO_MODE_ADVANCED_NAV_ALLOWLIST = new Set<string>([
  EVIDENCE_GRAPH_PATH,
  "/insights/ask-review-questions",
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  "/governance/audit",
  "/governance/policy-packs",
  "/governance/alerts",
  "/governance/alert-rules",
]);

import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";

/** Presenter safe mode hides billing, settings, and admin surfaces (#10). */
const PRESENTER_SAFE_MODE_NAV_HIDE = new Set<string>([
  "/administration",
  "/administration/billing",
  "/administration/workspace-settings",
  "/administration/api-keys",
  "/settings/roles",
  "/administration/baseline",
  "/administration/developer",
  "/settings/webhooks",
  "/integrations/webhooks",
  "/integrations/cloud-connections",
  "/administration/identity-providers",
  "/administration/identity-providers/saml",
  "/administration/identity-providers/oidc",
  "/administration/identity-providers/role-mapping",
  "/administration/identity-providers/diagnostics",
  "/administration/identity/sso-wizard",
  "/administration/scim-provisioning",
  "/insights/sponsor-report",
  "/insights/roi-summary",
]);

/** Pilot-tier links that are hidden in buyer demo nav (reduce noise vs core review story). */
const DEMO_MODE_EXPLICIT_NAV_HIDE = new Set<string>([
  ARCHITECTURE_SCORECARD_PATH,
  "/insights/search-review-evidence",
  "/administration/workspace-settings/recycle-bin",
]);

function normalizeOperatorNavHrefForDemo(href: string): string {
  const [path, query] = href.split("?", 2);
  const trimmed = readinessLookupPath(canonicalizeLegacyOperatorRoutePath(path.trim().length === 0 ? "/" : path));

  if (trimmed === "/architecture/reviews" && query !== undefined && query.includes("projectId=")) {
    return "/architecture/reviews";
  }

  return trimmed;
}

function shouldHideOperatorNavLinkInPresenterSafeMode(href: string): boolean {
  if (!isCtoDemoPresenterSafeModeEnv()) {
    return false;
  }

  const navKey = normalizeOperatorNavHrefForDemo(href);

  if (PRESENTER_SAFE_MODE_NAV_HIDE.has(navKey)) {
    return true;
  }

  if (navKey.startsWith("/administration/") || navKey.startsWith("/admin")) {
    return true;
  }

  return false;
}

/** In `NEXT_PUBLIC_DEMO_MODE`, omit hidden, admin-only, and non-allowlisted advanced links (buyer demos). */
export function shouldHideOperatorNavLinkInDemo(href: string, demoMode: boolean): boolean {
  if (!demoMode) {
    return false;
  }

  if (shouldHideOperatorNavLinkInPresenterSafeMode(href)) {
    return true;
  }

  const navKey = normalizeOperatorNavHrefForDemo(href);

  if (DEMO_MODE_EXPLICIT_NAV_HIDE.has(navKey)) {
    return true;
  }

  const tier = operatorRouteReadiness(href);

  if (tier === "hidden" || tier === "admin-only") {
    return true;
  }

  if (tier === "advanced-only") {
    return !DEMO_MODE_ADVANCED_NAV_ALLOWLIST.has(navKey);
  }

  return false;
}

/**
 * In demo mode, de-emphasize links that are admin-only or advanced-only but not on the demo allowlist.
 * Allowlisted advanced destinations (Graph, Compare, Ask, Findings) stay at full weight.
 */
export function isOperatorNavLinkAdvancedInDemo(href: string, demoMode: boolean): boolean {
  if (!demoMode) {
    return false;
  }

  const tier = operatorRouteReadiness(href);

  if (tier === "admin-only") {
    return true;
  }

  if (tier === "advanced-only") {
    const key = normalizeOperatorNavHrefForDemo(href);

    return !DEMO_MODE_ADVANCED_NAV_ALLOWLIST.has(key);
  }

  return false;
}
