/**
 * AO-39 — machine-readable Working route roles for nav/palette gates (AO-40–41).
 * Marketing/auth/help routes are classified separately; operator routes use the five Working roles.
 */
export const WORKING_ROUTE_ROLES = [
  "locator",
  "nestedJob",
  "inbox",
  "bindTool",
  "evalAdmin",
  "legacyPeerJob",
  "marketing",
  "auth",
  "help",
] as const;

export type WorkingRouteRole = (typeof WORKING_ROUTE_ROLES)[number];

export type WorkingRouteRoleRule = {
  readonly id: string;
  readonly role: WorkingRouteRole;
  readonly pattern: RegExp;
};

/** Ordered first-match wins. Keep nested/literal patterns before broad prefixes. */
export const WORKING_ROUTE_ROLE_RULES: readonly WorkingRouteRoleRule[] = [
  { id: "marketing-digest", role: "marketing", pattern: /^\/digest\// },
  { id: "marketing-showcase", role: "marketing", pattern: /^\/showcase\// },
  { id: "marketing-signup", role: "marketing", pattern: /^\/signup(\/|$)/ },
  {
    id: "marketing-public",
    role: "marketing",
    pattern:
      /^\/(accessibility|assurance-status|compliance-journey|faq|get-started|pricing|privacy|quick-scan|see-it|trust|welcome|why|why-archlucid)(\/|$)/,
  },
  { id: "auth", role: "auth", pattern: /^\/(403|auth(\/|$))/ },
  { id: "help", role: "help", pattern: /^\/help(\/|$)/ },
  {
    id: "nested-draft",
    role: "nestedJob",
    pattern: /^\/architecture\/architectures\/\[architectureId\]\/drafts\/\[draftId\]$/,
  },
  {
    id: "nested-review",
    role: "nestedJob",
    pattern: new RegExp("^/architecture/architectures/\\[architectureId\\]/reviews(/|$)"),
  },
  {
    id: "legacy-peer-review",
    role: "legacyPeerJob",
    pattern: new RegExp("^/architecture/reviews/\\[reviewId\\](/|$)"),
  },
  {
    id: "nested-draft-runtime",
    role: "nestedJob",
    pattern: /^\/architecture\/architectures\/[^/]+\/drafts\/[^/]+$/,
  },
  {
    id: "nested-review-runtime",
    role: "nestedJob",
    pattern: new RegExp("^/architecture/architectures/[^/]+/reviews(/|$)"),
  },
  {
    id: "legacy-peer-review-runtime",
    role: "legacyPeerJob",
    pattern: new RegExp("^/architecture/reviews/[^/]+(/|$)"),
  },
  {
    id: "locator-architecture-desk-catalog",
    role: "locator",
    pattern: /^\/architecture\/architectures(\/(new|\[architectureId\]))?$/,
  },
  {
    id: "locator-architecture-desk-runtime",
    role: "locator",
    pattern: /^\/architecture\/architectures(\/(new|[^/]+))?$/,
  },
  { id: "locator-operator-home", role: "locator", pattern: /^\/$/ },
  { id: "inbox-reviews-hub", role: "inbox", pattern: /^\/architecture\/reviews(\/new)?$/ },
  {
    id: "inbox-governance-queues",
    role: "inbox",
    pattern: /^\/governance\/(findings|approval-queue|alerts|needs-attention)(\/|$)/,
  },
  {
    id: "bind-tool-insights",
    role: "bindTool",
    pattern:
      /^\/insights\/(ask-review-questions|evidence-graph|compare-two-reviews|search-review-evidence)(\/|$)/,
  },
  {
    id: "bind-tool-architecture-intelligence",
    role: "bindTool",
    pattern: /^\/architecture\/architecture-intelligence(\/|$)/,
  },
  { id: "eval-admin-internal", role: "evalAdmin", pattern: /^\/internal(\/|$)/ },
  { id: "eval-admin-demo", role: "evalAdmin", pattern: /^\/demo(\/|$)/ },
  { id: "eval-admin-account", role: "evalAdmin", pattern: /^\/account(\/|$)/ },
  { id: "eval-admin-administration", role: "evalAdmin", pattern: /^\/administration(\/|$)/ },
  { id: "eval-admin-integrations", role: "evalAdmin", pattern: /^\/integrations(\/|$)/ },
  { id: "eval-admin-insights", role: "evalAdmin", pattern: /^\/insights(\/|$)/ },
  { id: "eval-admin-governance", role: "evalAdmin", pattern: /^\/governance(\/|$)/ },
  { id: "eval-admin-architecture-surfaces", role: "evalAdmin", pattern: /^\/architecture(\/|$)/ },
];

export function normalizeRoutePathname(pathname: string): string {
  const trimmed = pathname.trim();

  if (trimmed === "") {
    return "/";
  }

  const withoutQuery = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  const normalized = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

export function classifyWorkingRoutePathname(pathname: string): WorkingRouteRole | null {
  const normalized = normalizeRoutePathname(pathname);

  for (const rule of WORKING_ROUTE_ROLE_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.role;
    }
  }

  return null;
}

export function isWorkingOperatorRouteRole(role: WorkingRouteRole): boolean {
  return role !== "marketing" && role !== "auth" && role !== "help";
}

export function requiresOpenArchitecture(role: WorkingRouteRole): boolean {
  return role === "bindTool";
}

export function isLegacyPeerWorkingRoute(role: WorkingRouteRole): boolean {
  return role === "legacyPeerJob";
}

/** AO-41 — palette navigation rows allowed in Working mode (ADR 0077). */
export function isWorkingPaletteNavRole(role: WorkingRouteRole, pathname: string): boolean {
  if (role === "bindTool" || role === "legacyPeerJob" || role === "marketing" || role === "auth") {
    return false;
  }

  if (role === "locator" || role === "nestedJob" || role === "inbox" || role === "help") {
    return true;
  }

  if (role === "evalAdmin") {
    return /^\/administration(\/|$)/.test(normalizeRoutePathname(pathname));
  }

  return false;
}

