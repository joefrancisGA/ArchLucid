/** What a review comparison surfaces — shown as a compact value preview before results load. */
export const COMPARE_DIMENSION_PREVIEW_ITEMS: readonly {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    id: "scope",
    label: "Scope changes",
    description: "What entered or left the reviewed architecture boundary.",
  },
  {
    id: "findings",
    label: "New or resolved findings",
    description: "Findings added, closed, or materially changed between reviews.",
  },
  {
    id: "decisions",
    label: "Decision changes",
    description: "Recorded decisions and dispositions that moved between packages.",
  },
  {
    id: "evidence",
    label: "Evidence changes",
    description: "Artifacts, traces, and supporting evidence added or removed.",
  },
  {
    id: "governance",
    label: "Governance status changes",
    description: "Approval posture, monitors, and governance checkpoints over time.",
  },
] as const;

export const COMPARE_EMPTY_OUTPUT_TITLE = "Comparison output";

export const COMPARE_EMPTY_OUTPUT_BODY =
  "Select baseline and updated reviews, then click Compare reviews to see structured changes here.";

export const COMPARE_HOW_IT_WORKS_SUMMARY =
  "ArchLucid compares two finalized reviews and summarizes what changed in scope, findings, decisions, evidence, and governance status.";
