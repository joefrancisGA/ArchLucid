import {
  LEGACY_ALERTS_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_POLICY_PACKS_PATH,
} from "@/lib/governance-route-paths";
import { LEGACY_CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  LEGACY_ADMIN_SUPPORT_PATH,
  LEGACY_ADMIN_USERS_PATH,
  LEGACY_SETTINGS_ROLES_PATH,
  LEGACY_WORKSPACE_SECURITY_TRUST_PATH,
} from "@/lib/settings-admin-route-paths";

/**
 * Base path prefixes for `permanent: true` redirects in `next.config.ts`.
 * Keep in sync when adding customer-facing redirect sources.
 * Pre-release legacy bookmark shims and IA renames without redirects
 * (`/onboarding`, `/graph`, `/ask`, `/search`, `/snapshot`, alert-routing, digests, etc.) use App Router
 * pages when destination logic or query preservation requires it — no `next.config` redirect.
 */
export const NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS: readonly string[] = [
  "/runs",
  "/manifests",
  LEGACY_POLICY_PACKS_PATH,
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

    return pathname.startsWith(`${source}/`);
  });
}
