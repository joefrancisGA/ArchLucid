import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

/** Working route taxonomy for ADR 0077 inventory and nav/palette gates (AO-39). */
export type WorkingRouteRole =
  | "marketing"
  | "auth-onboarding"
  | "locator"
  | "nested-job"
  | "peer-review-job"
  | "inbox"
  | "tool-must-bind"
  | "eval-admin"
  | "settings-help"
  | "integrations"
  | "workspace-other";

export const WORKING_TOOL_MUST_BIND_HREFS: readonly string[] = [
  ASK_REVIEW_QUESTIONS_PATH,
  EVIDENCE_GRAPH_PATH,
  COMPARE_TWO_REVIEWS_PATH,
  SEARCH_REVIEW_EVIDENCE_PATH,
];

export const WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT =
  "Open an architecture desk first — this tool scopes to the system you are working on.";

const MARKETING_PATH_PREFIXES = [
  "/trust",
  "/pricing",
  "/privacy",
  "/welcome",
  "/why",
  "/faq",
  "/get-started",
  "/see-it",
  "/quick-scan",
  "/compliance-journey",
  "/assurance-status",
  "/accessibility",
  "/signup",
  "/showcase",
  "/digest/sponsor",
] as const;

const EVAL_ADMIN_INSIGHTS_PREFIXES = [
  "/insights/architecture-scorecard",
  "/insights/roi-summary",
  "/insights/pilot-outcomes",
  "/insights/workspace-health",
  "/insights/impact-preview",
  "/insights/patterns",
  "/insights/improvement-planning",
  "/insights/sponsor-report",
] as const;

const WORKING_PALETTE_ALLOWED_ROLES_WITHOUT_ARCHITECTURE: ReadonlySet<WorkingRouteRole> = new Set([
  "locator",
  "inbox",
  "nested-job",
  "peer-review-job",
  "settings-help",
  "integrations",
  "workspace-other",
]);

function normalizeRoutePath(pathname: string): string {
  const pathOnly = pathname.trim().split("?")[0]?.split("#")[0] ?? "";

  if (pathOnly.length === 0) {
    return "/";
  }

  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isWorkingToolMustBindHref(href: string): boolean {
  const path = normalizeRoutePath(href);

  return WORKING_TOOL_MUST_BIND_HREFS.some((prefix) => matchesPrefix(path, prefix));
}

/** Classifies an App Router pathname for Working inventory and gates (AO-39). */
export function classifyWorkingRouteRole(pathname: string): WorkingRouteRole {
  const path = normalizeRoutePath(pathname);

  if (path === "/" || path === ARCHITECTURES_LIST_PATH || path === ARCHITECTURES_NEW_PATH) {
    return "locator";
  }

  if (MARKETING_PATH_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return "marketing";
  }

  if (matchesPrefix(path, "/auth")) {
    return "auth-onboarding";
  }

  if (matchesPrefix(path, "/internal") || matchesPrefix(path, "/demo")) {
    return "eval-admin";
  }

  if (matchesPrefix(path, "/integrations")) {
    return "integrations";
  }

  if (
    /^\/architecture\/architectures\/[^/]+\/drafts\/[^/]+$/u.test(path)
    || /^\/architecture\/architectures\/[^/]+\/reviews\/(?:new|[^/]+)$/u.test(path)
  ) {
    return "nested-job";
  }

  if (/^\/architecture\/architectures\/[^/]+$/u.test(path)) {
    return "locator";
  }

  if (path === REVIEWS_LIST_PATH || path === REVIEWS_NEW_PATH) {
    return "inbox";
  }

  if (/^\/architecture\/reviews\/[^/]+/u.test(path)) {
    return "peer-review-job";
  }

  if (
    matchesPrefix(path, "/governance")
    || path === "/architecture/digests"
    || path === "/architecture/first-review-guide"
    || path === "/architecture/sponsor-dashboard"
  ) {
    return "inbox";
  }

  if (isWorkingToolMustBindHref(path)) {
    return "tool-must-bind";
  }

  if (path === "/architecture/architecture-intelligence") {
    return "eval-admin";
  }

  if (EVAL_ADMIN_INSIGHTS_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return "eval-admin";
  }

  if (
    matchesPrefix(path, "/administration")
    || matchesPrefix(path, "/help")
    || matchesPrefix(path, "/account")
    || path === "/403"
    || path === "/why-archlucid"
  ) {
    return "settings-help";
  }

  return "workspace-other";
}

export function isWorkingPaletteNavigationHrefAllowed(
  href: string,
  lastOpenArchitectureId: string | null | undefined,
): boolean {
  const role = classifyWorkingRouteRole(href);

  if (role === "marketing" || role === "auth-onboarding" || role === "eval-admin") {
    return false;
  }

  if (role === "tool-must-bind") {
    return (lastOpenArchitectureId?.trim() ?? "").length > 0;
  }

  return WORKING_PALETTE_ALLOWED_ROLES_WITHOUT_ARCHITECTURE.has(role);
}

/** Filters sidebar-visible hrefs for Working palette page search (AO-41). */
export function filterWorkingPaletteVisibleHrefs(
  hrefs: ReadonlySet<string>,
  lastOpenArchitectureId: string | null | undefined,
): ReadonlySet<string> {
  const filtered = new Set<string>();

  for (const href of hrefs) {
    if (isWorkingPaletteNavigationHrefAllowed(href, lastOpenArchitectureId)) {
      filtered.add(href);
    }
  }

  return filtered;
}
