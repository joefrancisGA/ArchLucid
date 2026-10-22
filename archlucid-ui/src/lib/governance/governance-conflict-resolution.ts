import type {
  GovernanceConflictRecord,
  GovernanceResolutionCandidate,
  GovernanceResolutionDecision,
} from "@/types/governance-resolution";

function compareCandidatesByPrecedence(
  a: GovernanceResolutionCandidate,
  b: GovernanceResolutionCandidate,
): number {
  if (a.precedenceRank !== b.precedenceRank) {
    return b.precedenceRank - a.precedenceRank;
  }

  const assignedCompare = b.assignedUtc.localeCompare(a.assignedUtc);

  if (assignedCompare !== 0) {
    return assignedCompare;
  }

  return b.assignmentId.localeCompare(a.assignmentId);
}

export function orderGovernanceCandidates(
  candidates: readonly GovernanceResolutionCandidate[],
): GovernanceResolutionCandidate[] {
  return [...candidates].sort(compareCandidatesByPrecedence);
}

export function getGovernanceConflictWinner(
  candidates: readonly GovernanceResolutionCandidate[],
): GovernanceResolutionCandidate | null {
  const selected = candidates.find((c) => c.wasSelected);

  if (selected !== undefined) {
    return selected;
  }

  const ordered = orderGovernanceCandidates(candidates);

  return ordered[0] ?? null;
}

export function getGovernanceConflictLosers(
  candidates: readonly GovernanceResolutionCandidate[],
  winner: GovernanceResolutionCandidate | null,
): GovernanceResolutionCandidate[] {
  if (winner === null) {
    return orderGovernanceCandidates(candidates);
  }

  return orderGovernanceCandidates(candidates).filter((c) => c.assignmentId !== winner.assignmentId);
}

export function findGovernanceResolutionReason(
  conflict: GovernanceConflictRecord,
  decisions: readonly GovernanceResolutionDecision[],
): string | null {
  const match = decisions.find(
    (d) => d.itemType === conflict.itemType && d.itemKey === conflict.itemKey,
  );

  return match?.resolutionReason?.trim() || null;
}

/** Mirrors server `BuildResolutionReason` when no matching decision row exists. */
export function buildGovernanceConflictResolutionReason(
  candidates: readonly GovernanceResolutionCandidate[],
): string {
  const ordered = orderGovernanceCandidates(candidates);

  if (ordered.length === 0) {
    return "No candidates.";
  }

  if (ordered.length === 1) {
    return "Only one applicable candidate existed.";
  }

  const winner = ordered[0]!;
  const second = ordered[1]!;

  if (winner.precedenceRank !== second.precedenceRank) {
    return "Higher governance scope tier (project > workspace > tenant), or pinned assignment within a tier, outranked the other candidate(s).";
  }

  if (winner.assignedUtc !== second.assignedUtc) {
    return "Same scope tier and pin state; the newer assignment (AssignedUtc) won.";
  }

  return "Same scope tier, pin state, and timestamp; winner chosen by deterministic tie-break (AssignmentId).";
}

export function resolveGovernanceConflictWhy(
  conflict: GovernanceConflictRecord,
  decisions: readonly GovernanceResolutionDecision[],
): string {
  return (
    findGovernanceResolutionReason(conflict, decisions)
    ?? buildGovernanceConflictResolutionReason(conflict.candidates)
    ?? conflict.description
  );
}
