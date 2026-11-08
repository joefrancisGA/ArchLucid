export const GOVERNANCE_BLOCKING_FINDING_COUNT_NOT_STORED_LABEL =
  "Blocking finding count was not stored." as const;

export function isGovernanceBlockingFindingCountStored(
  manifestUnresolvedIssueCount: number | null | undefined,
): boolean {
  return typeof manifestUnresolvedIssueCount === "number" && Number.isFinite(manifestUnresolvedIssueCount);
}
