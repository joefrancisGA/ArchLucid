/**
 * Shared founder acceptance route set (GTM M-104 / M-105 / M-99).
 * Keep this list small — grow via M-100 as exploratory defects are absorbed.
 */

export type FounderAcceptanceRoute = {
  readonly name: string;
  readonly path: string;
  /** Prefer skipping soft assertions when unauthenticated shell is expected. */
  readonly requiresAuth?: boolean;
};

/** Public / marketing surfaces that work without operator storageState. */
export const FOUNDER_PUBLIC_ROUTES: readonly FounderAcceptanceRoute[] = [
  { name: "Welcome", path: "/welcome" },
  { name: "Why ArchLucid", path: "/why" },
  { name: "Trust Center", path: "/trust" },
  { name: "Signup", path: "/signup" },
  { name: "Showcase Customer Intake", path: "/showcase/customer-intake-modernization" },
  { name: "Accessibility statement", path: "/accessibility" },
  { name: "Privacy", path: "/privacy" },
  { name: "Help", path: "/help" },
] as const;

/** Authenticated / operator shell — needs DevelopmentBypass, API key proxy, or ACCEPTANCE_STORAGE_STATE. */
export const FOUNDER_AUTHENTICATED_ROUTES: readonly FounderAcceptanceRoute[] = [
  { name: "Operator home", path: "/", requiresAuth: true },
  { name: "Reviews list", path: "/architecture/reviews", requiresAuth: true },
  { name: "New review", path: "/architecture/reviews/new", requiresAuth: true },
  { name: "Governance", path: "/governance/approval-queue", requiresAuth: true },
  { name: "Evidence graph", path: "/insights/evidence-graph", requiresAuth: true },
  { name: "Workspace settings", path: "/administration/tenant", requiresAuth: true },
] as const;

export function founderAcceptanceRoutes(options?: {
  readonly includeAuthenticated?: boolean;
}): readonly FounderAcceptanceRoute[] {
  const includeAuthenticated = options?.includeAuthenticated !== false;

  if (!includeAuthenticated) {
    return FOUNDER_PUBLIC_ROUTES;
  }

  return [...FOUNDER_PUBLIC_ROUTES, ...FOUNDER_AUTHENTICATED_ROUTES];
}
