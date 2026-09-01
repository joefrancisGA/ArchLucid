import type { CurrentPrincipal } from "@/lib/current-principal";
import { resolveGovernanceAssignedToMeIdentities } from "@/lib/governance/governance-assigned-to-me-identities";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export type WorkOwnershipDeleteEligibilityInput = {
  readonly createdByUserId?: string | null;
  readonly callerAuthorityRank: number;
  readonly allowCreatorDeleteOwnedWork: boolean;
  readonly callerPrincipal?: Pick<CurrentPrincipal, "name" | "meClaims">;
};

function callerIsTenantAdministrator(callerAuthorityRank: number): boolean {
  return callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
}

function callerIsCreator(
  createdByUserId: string,
  callerPrincipal: Pick<CurrentPrincipal, "name" | "meClaims"> | undefined,
): boolean {
  if (callerPrincipal === undefined) {
    return false;
  }

  const identities = resolveGovernanceAssignedToMeIdentities(callerPrincipal);
  const normalizedCreator = createdByUserId.trim().toLowerCase();

  return identities.some((identity) => identity.trim().toLowerCase() === normalizedCreator);
}

/** Mirrors server creator-or-admin delete policy for unsealed architectures and in-flight reviews. */
export function canDeleteOwnedWork(input: WorkOwnershipDeleteEligibilityInput): boolean {
  if (callerIsTenantAdministrator(input.callerAuthorityRank)) {
    return true;
  }

  const createdByUserId = input.createdByUserId?.trim() ?? "";

  if (createdByUserId.length === 0) {
    return true;
  }

  if (!input.allowCreatorDeleteOwnedWork) {
    return false;
  }

  return callerIsCreator(createdByUserId, input.callerPrincipal);
}
