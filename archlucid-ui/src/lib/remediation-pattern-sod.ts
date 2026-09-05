import type { CurrentPrincipal } from "@/lib/current-principal";
import { resolveGovernanceAssignedToMeIdentities } from "@/lib/governance/governance-assigned-to-me-identities";

import { REMEDIATION_PATTERN_STATUS } from "@/lib/remediation-pattern-status";
import type { RemediationPatternVersionRecord } from "@/lib/remediation-pattern-types";

function normalizeActor(value: string): string {
  return value.trim().toLowerCase();
}

/** Client-side SoD guard — API enforces the same rule on approve. */
export function canApproveRemediationPatternVersion(
  version: RemediationPatternVersionRecord,
  principal: CurrentPrincipal,
  canMutate: boolean,
): boolean {
  if (!canMutate)
    return false;

  if (version.status !== REMEDIATION_PATTERN_STATUS.underReview)
    return false;

  const actorIdentities = resolveGovernanceAssignedToMeIdentities(principal).map(normalizeActor);
  const author = normalizeActor(version.authorActorKey);

  if (author.length === 0)
    return true;

  return !actorIdentities.includes(author);
}

export function remediationPatternApprovalBlockedReason(
  version: RemediationPatternVersionRecord,
  principal: CurrentPrincipal,
  canMutate: boolean,
): string | null {
  if (!canMutate)
    return "Execute authority is required to approve patterns.";

  if (version.status !== REMEDIATION_PATTERN_STATUS.underReview)
    return "Only versions under review can be approved.";

  if (!canApproveRemediationPatternVersion(version, principal, canMutate))
    return "Approver cannot be the same actor as the pattern author (segregation of duties).";

  return null;
}
