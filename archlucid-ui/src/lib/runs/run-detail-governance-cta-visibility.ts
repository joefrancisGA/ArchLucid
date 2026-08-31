import { governanceGateLabelFromManifestStatus } from "@/lib/governance/governance-gate-display";
import { governanceApprovalQueueHref } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_APPROVAL_REVIEW_DETAIL_CTA_LABEL } from "@/lib/vocabulary/governance-approval-vocabulary";

export const RUN_DETAIL_GOVERNANCE_CTA_LABEL = GOVERNANCE_APPROVAL_REVIEW_DETAIL_CTA_LABEL;

export type RunDetailGovernanceCtaVisibilityInput = {
  readonly manifestId: string | null | undefined;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
};

/** True when a finalized review exists but governance approval has not been recorded yet. */
export function shouldShowRunDetailGovernanceCta(input: RunDetailGovernanceCtaVisibilityInput): boolean {
  if (input.buyerPolishedArtifactTable) {
    return false;
  }

  const manifestId = (input.manifestId ?? "").trim();

  if (manifestId.length === 0) {
    return false;
  }

  const existingDecision = (input.operatorGovernanceDecision ?? "").trim();

  if (existingDecision.length > 0) {
    return false;
  }

  const gateLabel = governanceGateLabelFromManifestStatus(input.manifestStatus);

  if (gateLabel === "Passed" || gateLabel === "Failed" || gateLabel === "Not required") {
    return false;
  }

  return true;
}

export function runDetailGovernanceWorkflowHref(runId: string): string {
  return governanceApprovalQueueHref(runId);
}
