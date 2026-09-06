/**
 * V1 registry of surfaces allowed to render Report Problem (TB-782).
 * TB-785 / TB-786 import this module — do not duplicate route lists elsewhere.
 */

export type ReportProblemSurfaceKind =
  | "reviews-hub-fatal"
  | "review-detail-fatal"
  | "sponsor-report-fatal"
  | "governance-queue-fatal"
  | "review-commit-export-fatal"
  | "api-problem-high-stakes"
  | "connectivity-error"
  | "auth-session-break"
  | "contact-support-help";

export type ReportProblemSurfaceEntry = {
  /** Stable id for tests and telemetry. */
  id: string;
  kind: ReportProblemSurfaceKind;
  /** App Router path pattern (`[param]` = single dynamic segment). Use `*` for component-global surfaces. */
  routePattern: string;
  /** `exact` (default) or `exact-or-child` for section roots like `/value-report`. */
  routeMatch?: "exact" | "exact-or-child";
  /** Source path under `archlucid-ui/src` (drift guard in TB-791). */
  componentPath: string;
  /** Operator-facing description for docs and support runbooks. */
  description: string;
};

/**
 * Initial high-stakes surfaces for V1 private beta.
 * Validation-only 400 cards are intentionally absent until owner expands the registry.
 */
export const REPORT_PROBLEM_V1_SURFACES: readonly ReportProblemSurfaceEntry[] = [
  {
    id: "reviews-hub-unexpected-response",
    kind: "reviews-hub-fatal",
    routePattern: "/architecture/reviews",
    componentPath: "app/(operator)/architecture/reviews/_sections/RunsPageView.tsx",
    description: "Reviews hub unexpected/broken response — not the empty-state list.",
  },
  {
    id: "review-detail-hard-load-failure",
    kind: "review-detail-fatal",
    routePattern: "/architecture/reviews/[reviewId]",
    componentPath: "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.tsx",
    description: "Review detail page-level load failure.",
  },
  {
    id: "sponsor-value-report-load-failure",
    kind: "sponsor-report-fatal",
    routePattern: "/insights/sponsor-report",
    routeMatch: "exact-or-child",
    componentPath: "app/(operator)/insights/sponsor-report",
    description: "Sponsor / sponsor value report hard load failure.",
  },
  {
    id: "governance-findings-queue-hard-failure",
    kind: "governance-queue-fatal",
    routePattern: "/governance/findings",
    componentPath: "app/(operator)/governance/findings",
    description: "Findings queue cannot load.",
  },
  {
    id: "review-commit-export-page-failure",
    kind: "review-commit-export-fatal",
    routePattern: "/architecture/reviews/[reviewId]",
    componentPath: "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.tsx",
    description: "Commit, seal, or export failure surfaced as page-level error on a review.",
  },
  {
    id: "operator-api-problem-high-stakes",
    kind: "api-problem-high-stakes",
    routePattern: "*",
    componentPath: "components/operator/OperatorApiProblem.tsx",
    description: "High-stakes API failure cards with correlation context (excludes validation-only 400 unless registry expands).",
  },
  {
    id: "operator-layered-connectivity-error",
    kind: "connectivity-error",
    routePattern: "*",
    componentPath: "components/operator/OperatorLayeredConnectivityError.tsx",
    description: "Layered upstream/API connectivity failure presentation.",
  },
  {
    id: "operator-role-gate-session-break",
    kind: "auth-session-break",
    routePattern: "*",
    componentPath: "components/operator/OperatorAccessDeniedPageClient.tsx",
    description: "User-visible auth or session break on /403 (OperatorRoleGate redirects here).",
  },
  {
    id: "contact-support-help-orientation",
    kind: "contact-support-help",
    routePattern: "/help/contact-support",
    componentPath: "components/help/ContactSupportHelpOrientationStack.tsx",
    description: "Contact support help — Report problem intake from the orientation action row.",
  },
  {
    id: "session-expired-sign-in-failure",
    kind: "auth-session-break",
    routePattern: "/auth/session-expired",
    componentPath: "app/(operator)/auth/session-expired/SessionExpiredClient.tsx",
    description: "Session-expired route when OIDC/JwtBearer sign-in cannot proceed (AuthErrorPanel path).",
  },
  {
    id: "access-denied-wrong-tenant",
    kind: "auth-session-break",
    routePattern: "/403",
    componentPath: "components/operator/OperatorAccessDeniedPageClient.tsx",
    description: "Authenticated user signed into the wrong tenant or lacks tenant authorization (403 access denied).",
  },
  {
    id: "auth-jwt-insufficient-scope",
    kind: "auth-session-break",
    routePattern: "/403",
    componentPath: "components/operator/OperatorAccessDeniedPageClient.tsx",
    description: "JwtBearer principal authenticated but lacks a recognized app role or scope mapping (403 access denied).",
  },
  {
    id: "auth-signin-cannot-proceed",
    kind: "auth-session-break",
    routePattern: "/auth/signin",
    componentPath: "app/(operator)/auth/signin/SignInFlowPanelShell.tsx",
    description: "Sign-in fatal error when OIDC/JwtBearer cannot start or no sign-in methods are configured (invite-wave recovery).",
  },
  {
    id: "auth-invitation-accept-validation-failure",
    kind: "auth-session-break",
    routePattern: "/auth/invite",
    componentPath: "app/(operator)/auth/invite/InvitationAcceptPageClient.tsx",
    description: "Invitation accept validation failed, token missing, or invite expired — invite-wave recovery surface.",
  },
] as const;

/** Static App Router siblings that must not satisfy `[reviewId]`-style dynamic segments. */
const REPORT_PROBLEM_RESERVED_DYNAMIC_SEGMENTS: Readonly<Record<string, readonly string[]>> = {
  "/architecture/reviews/[reviewId]": ["new"],
};

/**
 * Returns whether a pathname matches a registered route pattern.
 * Exact match for static paths; segment-count match for `[param]` patterns.
 */
export function pathnameMatchesReportProblemRoute(
  pattern: string,
  pathname: string,
  routeMatch: "exact" | "exact-or-child" = "exact",
): boolean {
  if (pattern === "*") {
    return true;
  }

  const normalizedPath = normalizePathname(pathname);
  const normalizedPattern = normalizePathname(pattern);

  if (matchesReservedDynamicSegment(normalizedPattern, normalizedPath)) {
    return false;
  }

  if (!normalizedPattern.includes("[")) {
    if (normalizedPath === normalizedPattern) {
      return true;
    }

    if (routeMatch === "exact-or-child") {
      return normalizedPath.startsWith(`${normalizedPattern}/`);
    }

    return false;
  }

  const patternParts = normalizedPattern.split("/").filter((part) => part.length > 0);
  const pathParts = normalizedPath.split("/").filter((part) => part.length > 0);

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  return patternParts.every((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return pathParts[index]!.length > 0;
    }

    return segment === pathParts[index];
  });
}

/**
 * Surfaces whose route pattern matches the current pathname (includes `*` component-global entries).
 */
export function reportProblemSurfacesForPathname(pathname: string): ReportProblemSurfaceEntry[] {
  return REPORT_PROBLEM_V1_SURFACES.filter((surface) =>
    pathnameMatchesReportProblemRoute(
      surface.routePattern,
      pathname,
      surface.routeMatch ?? "exact",
    ),
  );
}

export function findReportProblemSurfaceById(surfaceId: string): ReportProblemSurfaceEntry | undefined {
  const id = surfaceId.trim();

  if (id.length === 0) {
    return undefined;
  }

  return REPORT_PROBLEM_V1_SURFACES.find((surface) => surface.id === id);
}

/** Whether `OperatorApiProblem` may render Report problem (excludes validation-only 400). */
export function isReportProblemEnabledForApiProblemFailure(input: {
  readonly httpStatus: number | null;
  readonly isValidationFailure: boolean;
}): boolean {
  if (findReportProblemSurfaceById("operator-api-problem-high-stakes") === undefined) {
    return false;
  }

  if (input.isValidationFailure && input.httpStatus === 400) {
    return false;
  }

  return true;
}

/** Whether `OperatorLayeredConnectivityError` may render Report problem. */
export function isReportProblemEnabledForConnectivityError(): boolean {
  return findReportProblemSurfaceById("operator-layered-connectivity-error") !== undefined;
}

/** Whether a registry surface id is enabled for fatal page Report problem (TB-786). */
export function isReportProblemEnabledForSurface(surfaceId: string): boolean {
  return findReportProblemSurfaceById(surfaceId) !== undefined;
}

function matchesReservedDynamicSegment(pattern: string, pathname: string): boolean {
  const reservedSegments = REPORT_PROBLEM_RESERVED_DYNAMIC_SEGMENTS[pattern];

  if (reservedSegments === undefined || reservedSegments.length === 0) {
    return false;
  }

  const pathParts = pathname.split("/").filter((part) => part.length > 0);
  const patternParts = pattern.split("/").filter((part) => part.length > 0);

  if (pathParts.length !== patternParts.length) {
    return false;
  }

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]!;
    const pathPart = pathParts[index]!;

    if (!patternPart.startsWith("[") || !patternPart.endsWith("]")) {
      continue;
    }

    if (reservedSegments.includes(pathPart)) {
      return true;
    }
  }

  return false;
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();

  if (trimmed.length === 0) {
    return "/";
  }

  const withoutTrailing = trimmed.replace(/\/+$/, "");

  if (withoutTrailing.length === 0) {
    return "/";
  }

  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`;
}
