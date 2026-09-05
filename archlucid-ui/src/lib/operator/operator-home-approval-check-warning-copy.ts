/** Canonical home vocabulary for governance warning pressure (P1-8). */
export const OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR = "approval-check warning" as const;

export const OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL = "approval-check warnings" as const;

export function formatOperatorHomeApprovalCheckWarningCount(count: number): string {
  const safeCount = Math.max(0, Math.trunc(count));

  if (safeCount === 1) {
    return `1 ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR}`;
  }

  return `${safeCount} ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL}`;
}

/** Home Recent reviews filter chip — shorter than metric vocabulary. */
export const OPERATOR_HOME_APPROVAL_WARNING_FILTER_LABEL = "Has approval warnings" as const;

export function formatOperatorHomeApprovalCheckWarningFilterLabel(): string {
  return OPERATOR_HOME_APPROVAL_WARNING_FILTER_LABEL;
}

export function formatOperatorHomeApprovalCheckWarningActiveFilterLine(): string {
  return `Showing reviews with ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL}`;
}
