import {
  BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import {
  GOVERNANCE_ASSIGNED_TO_ME_CLAIM_DISCIPLINE,
} from "@/lib/governance/governance-assigned-to-me-evidence-copy";
import {
  GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
} from "@/lib/governance/governance-findings-evidence-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE =
  "Open findings assigned to you for remediation across issues." as const;

export const SECURENOW_BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD =
  "Personal remediation queue — open findings assigned to you across issues." as const;

export const SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE =
  "Findings is the queue for resolving findings across issues — not a full audit export on its own. Open a finding detail, Evidence graph, or Audit when you need export-ready records." as const;

export const SECURENOW_GOVERNANCE_JOB_ASSIGNED_TO_ME_WHEN_TO_USE =
  "Use your personal queue to remediate findings assigned to you across issues." as const;

export const SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE =
  "Use the Decision register to browse security decisions locked with finalized review records." as const;

export function isSecureNowProductLine(productLineId: ProductLineId): boolean {
  return productLineId === "security";
}

export function resolveGovernanceAssignedToMePageSubtitle(
  productLineId: ProductLineId,
  buyerPolishedShell: boolean,
): string {
  if (isSecureNowProductLine(productLineId)) {
    return buyerPolishedShell
      ? SECURENOW_BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD
      : SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE;
  }

  return buyerPolishedShell
    ? BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD
    : "Open findings assigned to you for remediation across reviews in this workspace.";
}

export function resolveGovernanceAssignedToMeClaimDiscipline(
  productLineId: ProductLineId,
  buyerPolishedShell: boolean,
): string {
  if (buyerPolishedShell) {
    return GOVERNANCE_ASSIGNED_TO_ME_CLAIM_DISCIPLINE;
  }

  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE;
  }

  return GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE;
}

export function shouldShowGovernanceAssignedToMeWorkspaceLabel(productLineId: ProductLineId): boolean {
  return !isSecureNowProductLine(productLineId);
}

export function resolveGovernanceJobAssignedToMeWhenToUse(productLineId: ProductLineId): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GOVERNANCE_JOB_ASSIGNED_TO_ME_WHEN_TO_USE;
  }

  return "Use your personal queue to remediate findings assigned to you across reviews in this workspace.";
}

export function resolveGovernanceJobRecordDecisionsWhenToUse(productLineId: ProductLineId): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE;
  }

  return "Use the Decision register to browse architecture decisions locked with finalized review records.";
}
