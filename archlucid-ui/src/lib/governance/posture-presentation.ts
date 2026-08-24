import type { PillarExaminationState, PillarFindingAggregate } from "@/lib/api/governance-stickiness-api";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

const PILLAR_EXAMINATION_STATUS_LABELS: Readonly<Record<PillarExaminationState, string>> = {
  Examined: "Examined",
  PartiallyExamined: "Partially examined",
  NotExamined: "Not examined",
  Unavailable: "Unavailable",
};

export function pillarExaminationStatusLabel(state: PillarExaminationState): string {
  return PILLAR_EXAMINATION_STATUS_LABELS[state];
}

export function pillarExaminationStatusTagKind(state: PillarExaminationState): EnterpriseStatusKind {
  switch (state) {
    case "Examined":
      return "ready";

    case "PartiallyExamined":
    case "NotExamined":
      return "needs-attention";

    case "Unavailable":
      return "blocked";

    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

/** Total findings attributed to a pillar (severity buckets only — no score). */
export function pillarFindingCount(counts: PillarFindingAggregate): number {
  return counts.criticalCount + counts.errorCount + counts.warningCount + counts.infoCount;
}
