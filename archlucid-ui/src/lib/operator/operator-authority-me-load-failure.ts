import type { CurrentPrincipal } from "@/lib/current-principal";

/** True when the operator shell settled on a synthetic principal after an /me transport failure. */
export function isOperatorAuthorityMeLoadFailure(principal: CurrentPrincipal): boolean {
  if (principal.provenance !== "synthetic") {
    return false;
  }

  const reason = principal.syntheticReason;

  if (reason === undefined) {
    return false;
  }

  return reason === "me-http" || reason === "me-network" || reason === "me-timeout";
}
