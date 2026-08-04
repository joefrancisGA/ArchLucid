/**
 * Product-facing readiness tiers for operator routes (nav gating, demo shell copy).
 * API policy and `[Authorize]` remain authoritative; this is UX-only.
 */
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

export type RouteReadinessTier = "demo-ready" | "advanced-only" | "admin-only" | "hidden";

const READINESS_BY_PATH: Record<string, RouteReadinessTier> = {
  "/": "demo-ready",
  "/architecture/first-review-guide": "demo-ready",
  "/architecture/reviews/new": "demo-ready",
  "/architecture/reviews?projectId=default": "demo-ready",
  "/help": "demo-ready",
  "/insights/ask-review-questions": "demo-ready",
  "/insights/search-review-evidence": "demo-ready",
  [ARCHITECTURE_SCORECARD_PATH]: "demo-ready",
  "/executive/scorecard": "demo-ready",
  "/architecture/reviews": "demo-ready",
  "/governance/findings": "advanced-only",
  "/administration/settings/security-trust": "demo-ready",
  "/administration/settings/preferences": "demo-ready",
  "/workspace/security-trust": "demo-ready",
  "/sponsor-report/executive-summary": "advanced-only",
  "/sponsor-report/pilot-outcomes": "advanced-only",
  "/sponsor-report/roi-summary": "advanced-only",
  "/value-report": "advanced-only",
  "/value-report/pilot": "advanced-only",
  "/value-report/roi": "advanced-only",
  [EVIDENCE_GRAPH_PATH]: "advanced-only",
  [COMPARE_TWO_REVIEWS_PATH]: "advanced-only",
  "/replay": "advanced-only",
  "/governance/advisory-scans": "advanced-only",
  "/planning": "advanced-only",
  "/insights/planning": "advanced-only",
  "/digests": "advanced-only",
  [IMPACT_PREVIEW_PATH]: "advanced-only",
  "/integrations/teams": "advanced-only",
  "/integrations/cloud-connections": "admin-only",
  "/settings/cloud-connections": "admin-only",
  "/integrations/slack": "advanced-only",
  "/integrations/jira": "admin-only",
  "/integrations/azure-boards": "admin-only",
  "/integrations/servicenow": "admin-only",
  "/integrations/webhooks": "advanced-only",
  "/administration/connection-status": "advanced-only",
  "/administration/settings/ai-usage": "admin-only",
  "/settings/cost-reporting": "admin-only",
  "/governance/setup": "advanced-only",
  [GOVERNANCE_APPROVAL_QUEUE_PATH]: "advanced-only",
  "/governance/dashboard": "advanced-only",
  [GOVERNANCE_STANDARDS_AND_RULES_PATH]: "advanced-only",
  "/governance/policy-packs": "advanced-only",
  "/governance/audit": "advanced-only",
  "/governance/alerts": "advanced-only",
  "/governance/alert-rules": "advanced-only",
  "/policy-packs": "advanced-only",
  "/audit": "advanced-only",
  "/administration/system-health": "demo-ready",
  "/alerts": "advanced-only",
  "/alert-rules": "advanced-only",
  "/demo/explain": "hidden",

  "/internal/product-learning": "advanced-only",
  "/internal-operations/recommendation-learning": "advanced-only",
  "/admin/health": "admin-only",
  "/admin/deployment-status": "admin-only",
  "/admin/configuration": "admin-only",
  "/admin/pricing-quote-aging": "hidden",
  "/admin/trial-funnel": "admin-only",
  "/admin/fleet-llm-cogs": "hidden",
  "/admin/tenants": "hidden",
  "/admin/tenant-health": "hidden",
  "/admin/support": "admin-only",
  "/admin/users": "admin-only",
  "/administration/settings/support": "admin-only",
  "/administration/settings/users": "admin-only",
  "/administration/settings/tenant": "admin-only",
  "/administration/settings/tenant/recycle-bin": "admin-only",
  "/administration/settings/baseline": "advanced-only",
  "/administration/settings/developer": "advanced-only",
  "/administration/settings/billing": "advanced-only",
  "/settings/webhooks": "advanced-only",
  "/settings/roles": "admin-only",
  "/administration/settings/api-keys": "admin-only",
};

/**
 * Resolves readiness for a sidebar or deep link `href` (strips query except projectId on `/architecture/reviews` list).
 */
export function operatorRouteReadiness(href: string): RouteReadinessTier {
  const [path, query] = href.split("?", 2);

  if (path === "/architecture/reviews" && query !== undefined && query.includes("projectId=")) {
    const fromTable = READINESS_BY_PATH["/architecture/reviews?projectId=default"];

    return fromTable ?? "demo-ready";
  }

  const trimmedPath = path.trim().length === 0 ? "/" : path;

  if (trimmedPath.startsWith("/governance/approval-requests")) {
    return "admin-only";
  }

  const exact = READINESS_BY_PATH[href] ?? READINESS_BY_PATH[trimmedPath];

  if (exact !== undefined) {
    return exact;
  }

  return "demo-ready";
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
  "/audit",
  "/policy-packs",
  "/alerts",
  "/alert-rules",
]);

import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";

/** Presenter safe mode hides billing, settings, and admin surfaces (#10). */
const PRESENTER_SAFE_MODE_NAV_HIDE = new Set<string>([
  "/administration/settings",
  "/administration/settings/billing",
  "/administration/settings/tenant",
  "/administration/settings/api-keys",
  "/settings/roles",
  "/administration/settings/baseline",
  "/administration/settings/developer",
  "/settings/webhooks",
  "/integrations/webhooks",
  "/integrations/cloud-connections",
  "/settings/cloud-connections",
  "/administration/settings/identity-providers",
  "/administration/settings/identity-providers/saml",
  "/administration/settings/identity-providers/oidc",
  "/administration/settings/identity-providers/role-mapping",
  "/administration/settings/identity-providers/diagnostics",
  "/administration/settings/identity/sso-wizard",
  "/administration/settings/scim-provisioning",
  "/sponsor-report/executive-summary",
  "/sponsor-report/pilot-outcomes",
  "/sponsor-report/roi-summary",
  "/value-report",
  "/value-report/pilot",
  "/value-report/roi",
]);

/** Pilot-tier links that are hidden in buyer demo nav (reduce noise vs core review story). */
const DEMO_MODE_EXPLICIT_NAV_HIDE = new Set<string>([
  ARCHITECTURE_SCORECARD_PATH,
  "/insights/search-review-evidence",
  "/administration/settings/tenant/recycle-bin",
]);

function normalizeOperatorNavHrefForDemo(href: string): string {
  const [path, query] = href.split("?", 2);
  const trimmed = path.trim().length === 0 ? "/" : path;

  if (trimmed === "/architecture/reviews" && query !== undefined && query.includes("projectId=")) {
    return "/architecture/reviews?projectId=default";
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

  if (navKey.startsWith("/administration/settings/") || navKey.startsWith("/admin")) {
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
