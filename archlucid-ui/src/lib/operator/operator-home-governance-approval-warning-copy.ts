/** Canonical home vocabulary for governance approval warning pressure. */
export const OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_SINGULAR = "governance approval warning" as const;

export const OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL = "governance approval warnings" as const;

export function formatOperatorHomeGovernanceApprovalWarningCount(count: number): string {
  const safeCount = Math.max(0, Math.trunc(count));

  if (safeCount === 1) {
    return `1 ${OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_SINGULAR}`;
  }

  return `${safeCount} ${OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL}`;
}

/** Home Recent reviews filter chip — shorter than metric vocabulary. */
export const OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_FILTER_LABEL = "Has approval warnings" as const;

export function formatOperatorHomeGovernanceApprovalWarningFilterLabel(): string {
  return OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_FILTER_LABEL;
}

export function formatOperatorHomeGovernanceApprovalWarningActiveFilterLine(): string {
  return `Showing reviews with ${OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL}`;
}
