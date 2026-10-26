export const FINDINGS_SNAPSHOT_NOT_STORED_LINE = "Findings snapshot was not stored." as const;

export function formatDecisionSnapshotGovernanceOutcome(input: {
  readonly governanceDecisionLabel: string;
  readonly blockingFindingCount: number;
}): string {
  const label = input.governanceDecisionLabel.trim();

  if (input.blockingFindingCount <= 0) {
    return label;
  }

  if (/blocked/i.test(label)) {
    return label;
  }

  const noun = input.blockingFindingCount === 1 ? "finding" : "findings";

  return `${label} · blocked by ${input.blockingFindingCount} unresolved ${noun}`;
}

export function formatDecisionSnapshotFindingsLine(
  openCount: number,
  blockingCount: number,
  awaitingActionCount: number,
  hasFindingsSnapshot: boolean = true,
): string {
  if (!hasFindingsSnapshot) {
    return FINDINGS_SNAPSHOT_NOT_STORED_LINE;
  }

  if (openCount <= 0) {
    return "None open";
  }

  const segments: string[] = [`${openCount} open`];

  if (blockingCount > 0) {
    segments.push(`${blockingCount} block${blockingCount === 1 ? "s" : ""} approval`);
  }

  const triageOnly = Math.max(0, awaitingActionCount - blockingCount);

  if (triageOnly > 0) {
    segments.push(`${triageOnly} need${triageOnly === 1 ? "s" : ""} triage`);
  }

  return segments.join(" · ");
}
