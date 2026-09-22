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

export function canSubmitRemediationPatternVersion(
  version: RemediationPatternVersionRecord,
  canMutate: boolean,
): boolean {
  if (!canMutate) {
    return false;
  }

  return version.status === REMEDIATION_PATTERN_STATUS.draft;
}

export function remediationPatternSubmitBlockedReason(
  version: RemediationPatternVersionRecord | null,
  canMutate: boolean,
): string | null {
  if (!canMutate) {
    return "Execute authority is required to submit patterns.";
  }

  if (version === null) {
    return "Select a Draft version to submit for review.";
  }

  if (version.status !== REMEDIATION_PATTERN_STATUS.draft) {
    return "Only Draft versions can be submitted for review.";
  }

  return null;
}

export function remediationPatternApprovalBlockedReason(
  version: RemediationPatternVersionRecord,
  principal: CurrentPrincipal,
  canMutate: boolean,
  hasViewedVersionContent = true,
): string | null {
  if (!canMutate)
    return "Execute authority is required to approve patterns.";

  if (version.status !== REMEDIATION_PATTERN_STATUS.underReview)
    return "Only versions under review can be approved.";

  if (!hasViewedVersionContent)
    return "Review the pattern content panel before approving this version.";

  if (!canApproveRemediationPatternVersion(version, principal, canMutate))
    return "Approver cannot be the same actor as the pattern author (segregation of duties).";

  return null;
}
