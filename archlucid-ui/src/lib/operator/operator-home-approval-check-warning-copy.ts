/** Canonical home vocabulary for governance warning pressure (P1-8). */
export const OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR = "Approval-check warning" as const;

export const OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL = "Approval-check warnings" as const;

export function formatOperatorHomeApprovalCheckWarningCount(count: number): string {
  const safeCount = Math.max(0, Math.trunc(count));

  if (safeCount === 1) {
    return `1 ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR}`;
  }

  return `${safeCount} ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL}`;
}

export function formatOperatorHomeApprovalCheckWarningFilterLabel(): string {
  return `Has ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL}`;
}

export function formatOperatorHomeApprovalCheckWarningActiveFilterLine(): string {
  return `Showing reviews with ${OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL}`;
}
