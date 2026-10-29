import { resolveBlockingFindingCountPresentation } from "./blocking-finding-count-display";

export const FINDINGS_SNAPSHOT_NOT_STORED_LINE = "Findings snapshot was not stored." as const;

export function formatDecisionSnapshotGovernanceOutcome(input: {
  readonly governanceDecisionLabel: string;
  readonly blockingFindingCount: number | null | undefined;
}): string {
  const label = input.governanceDecisionLabel.trim();

  if (
    input.blockingFindingCount === null
    || input.blockingFindingCount === undefined
    || !Number.isFinite(input.blockingFindingCount)
  ) {
    return label;
  }

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
  blockingCount: number | null | undefined,
  awaitingActionCount: number,
  hasFindingsSnapshot: boolean = true,
): string {
  if (!hasFindingsSnapshot) {
    return FINDINGS_SNAPSHOT_NOT_STORED_LINE;
  }

  if (openCount <= 0) {
    return "None open";
  }

  const blockingPresentation = resolveBlockingFindingCountPresentation(blockingCount);
  const segments: string[] = [`${openCount} open`];

  if (blockingPresentation.known && blockingPresentation.value > 0) {
    const blockingValue = blockingPresentation.value;
    segments.push(`${blockingValue} block${blockingValue === 1 ? "s" : ""} approval`);
  }

  const triageOnly = Math.max(0, awaitingActionCount - blockingPresentation.value);

  if (triageOnly > 0) {
    segments.push(`${triageOnly} need${triageOnly === 1 ? "s" : ""} triage`);
  }

  return segments.join(" · ");
}
