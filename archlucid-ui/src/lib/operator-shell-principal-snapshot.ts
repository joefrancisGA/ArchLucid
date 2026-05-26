import type { CurrentPrincipal } from "@/lib/current-principal";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

let latestPrincipal: CurrentPrincipal | null = null;

/** Updated by {@link OperatorNavAuthorityProvider} so HTTP handlers can detect missing role claims. */
export function publishOperatorShellPrincipalSnapshot(principal: CurrentPrincipal): void {
  latestPrincipal = principal;
}

/**
 * True when the signed-in JWT principal authenticated but carries no recognized ArchLucid app role claim.
 * Used for operator-shell 403 troubleshooting (not for principals that have a role but lack execute permission).
 */
export function shouldShowJwtBearerMissingRoleBanner(): boolean {
  if (!isJwtAuthMode() || !isLikelySignedIn()) {
    return false;
  }

  if (latestPrincipal === null || latestPrincipal.provenance !== "auth-me") {
    return false;
  }

  return !latestPrincipal.hasRecognizedArchLucidRole;
}
