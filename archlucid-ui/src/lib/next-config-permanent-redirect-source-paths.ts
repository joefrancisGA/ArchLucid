import {
  LEGACY_ALERTS_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_GOVERNANCE_RESOLUTION_PATH,
  LEGACY_POLICY_PACKS_PATH,
} from "@/lib/governance-route-paths";
import { LEGACY_CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { LEGACY_ASK_PATH } from "@/lib/ask-review-questions-route";
import { LEGACY_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { LEGACY_ONBOARDING_PATH } from "@/lib/first-review-guide-route";
import {
  LEGACY_ADMIN_SUPPORT_PATH,
  LEGACY_ADMIN_USERS_PATH,
  LEGACY_SETTINGS_ROLES_PATH,
  LEGACY_WORKSPACE_SECURITY_TRUST_PATH,
} from "@/lib/settings-admin-route-paths";

/**
 * Base path prefixes for `permanent: true` redirects in `next.config.ts`.
 * Keep in sync when adding customer-facing redirect sources.
 * Pre-release legacy bookmark shims (alert-routing, digests, advisory, quick-start, etc.) were retired.
 */
export const NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS: readonly string[] = [
  "/runs",
  "/manifests",
  LEGACY_POLICY_PACKS_PATH,
  LEGACY_GOVERNANCE_RESOLUTION_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_ALERTS_PATH,
  "/settings/webhooks",
  LEGACY_CLOUD_CONNECTIONS_PATH,
  LEGACY_WORKSPACE_SECURITY_TRUST_PATH,
  LEGACY_ADMIN_USERS_PATH,
  LEGACY_ADMIN_SUPPORT_PATH,
  LEGACY_SETTINGS_ROLES_PATH,
  "/dashboard",
  "/executive/dashboard",
  "/portfolio",
  "/executive/reviews",
  LEGACY_ONBOARDING_PATH,
  LEGACY_GRAPH_PATH,
  LEGACY_ASK_PATH,
  "/help/cloud-connections-azure",
  "/help/cloud-connections-aws",
  "/help/cloud-connections-gcp",
] as const;

export function hrefPathname(href: string): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return "/";
  }

  return (trimmed.split("?")[0] ?? "/").trim() || "/";
}

/**
 * Sources that redirect only the exact path (no `/:path*` rule in `next.config.ts`).
 * Subpaths such as retired `/onboarding/start` must not be treated as redirect hops.
 */
const EXACT_ONLY_PERMANENT_REDIRECT_SOURCE_PATHS = new Set<string>([LEGACY_ONBOARDING_PATH]);

/** True when an in-app href targets a legacy redirect source (extra hop for users). */
export function hrefTargetsPermanentRedirectSource(
  href: string,
  sources: readonly string[] = NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
): boolean {
  const pathname = hrefPathname(href);

  return sources.some((source) => {
    if (pathname === source) {
      return true;
    }

    if (EXACT_ONLY_PERMANENT_REDIRECT_SOURCE_PATHS.has(source)) {
      return false;
    }

    return pathname.startsWith(`${source}/`);
  });
}
