import {
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
} from "@/lib/identity-providers-settings-copy";
import {
  resolveIdentityProvidersOverview,
  type ResolveIdentityProvidersOverviewInput,
} from "@/lib/resolve-identity-providers-overview";

/**
 * Single definition of "corporate sign-in is wired" shared by the settings readiness board
 * and the finish-setup wizard, so the two surfaces cannot disagree about the same tenant.
 * Returns `null` when identity diagnostics are unavailable — callers must not treat that as configured.
 */
export function resolveCorporateSignInConfigured(
  identity: ResolveIdentityProvidersOverviewInput | null,
  identityLoadFailed: boolean,
): boolean | null {
  if (identityLoadFailed || identity === null) {
    return null;
  }

  const overview = resolveIdentityProvidersOverview(identity);

  return overview.ssoStatus === IDENTITY_PROVIDERS_STATUS_ENABLED
    || overview.oidcStatus === IDENTITY_PROVIDERS_STATUS_HEALTHY;
}
