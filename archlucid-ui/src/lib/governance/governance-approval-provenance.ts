import { formatInstantForBuyerGovernance } from "@/lib/locale-datetime";
import { formatActionActorName } from "@/lib/action-actor-display";

/** Sourced governance approval fields required before the status banner may render. */
export type GovernanceApprovalProvenance = {
  readonly approverLabel: string;
  readonly approvedAtUtc: string;
  readonly scopeLabel: string;
  readonly recordId: string;
};

export function hasGovernanceApprovalProvenance(
  provenance: GovernanceApprovalProvenance | null | undefined,
): provenance is GovernanceApprovalProvenance {
  if (provenance === null || provenance === undefined) {
    return false;
  }

  return (
    provenance.approverLabel.trim().length > 0 &&
    provenance.approvedAtUtc.trim().length > 0 &&
    provenance.scopeLabel.trim().length > 0 &&
    provenance.recordId.trim().length > 0
  );
}

export function formatGovernanceApprovalProvenanceTimestamp(approvedAtUtc: string): string {
  return formatInstantForBuyerGovernance(approvedAtUtc.trim());
}

export function buildGovernanceApprovalProvenanceSummaryLines(
  provenance: GovernanceApprovalProvenance,
): readonly string[] {
  return [
    `Approver: ${formatActionActorName(provenance.approverLabel)}`,
    `Approved: ${formatGovernanceApprovalProvenanceTimestamp(provenance.approvedAtUtc)}`,
    `Scope: ${provenance.scopeLabel.trim()}`,
    `Record: ${provenance.recordId.trim()}`,
  ];
}
