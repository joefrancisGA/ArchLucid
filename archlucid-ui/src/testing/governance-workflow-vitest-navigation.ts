export type GovernanceWorkflowVitestNavigationState = {
  searchParams: URLSearchParams;
};

export function resetGovernanceWorkflowVitestNavigation(
  state: GovernanceWorkflowVitestNavigationState,
): void {
  state.searchParams = new URLSearchParams();
}

export function scopeGovernanceWorkflowVitestReview(
  state: GovernanceWorkflowVitestNavigationState,
  runId: string,
): void {
  state.searchParams = new URLSearchParams({ runId });
}
