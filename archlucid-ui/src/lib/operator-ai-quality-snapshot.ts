export type OperatorAiQualitySnapshotDisposition = "PASS" | "WARN" | "NOT_GENERATED";

export type OperatorAiQualityHistoryEntry = {
  readonly generatedUtc: string;
  readonly disposition: OperatorAiQualitySnapshotDisposition;
  readonly retrievalIr: OperatorAiQualitySnapshot["retrievalIr"];
};

export type OperatorAiQualitySnapshot = {
  readonly generatedUtc: string;
  readonly disposition: OperatorAiQualitySnapshotDisposition;
  readonly retrievalIr: {
    readonly casesEvaluated: number | null;
    readonly meanRecallAt5: number | null;
    readonly meanMrr: number | null;
    readonly floorRecallAt5: number | null;
    readonly floorMrr: number | null;
  };
  readonly history?: readonly OperatorAiQualityHistoryEntry[];
  readonly remediationLinks: readonly {
    readonly label: string;
    readonly path: string;
  }[];
};

export function dispositionLabel(disposition: OperatorAiQualitySnapshotDisposition): string {
  switch (disposition) {
    case "PASS":
      return "PASS";
    case "WARN":
      return "WARN";
    case "NOT_GENERATED":
      return "Not generated";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

export function dispositionClass(disposition: OperatorAiQualitySnapshotDisposition): string {
  switch (disposition) {
    case "PASS":
      return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
    case "WARN":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "NOT_GENERATED":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}
