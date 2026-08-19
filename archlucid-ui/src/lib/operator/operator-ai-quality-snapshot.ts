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

/** Loads the static CI-generated assistant readiness snapshot from the app public folder. */
export async function fetchOperatorAiQualitySnapshot(): Promise<OperatorAiQualitySnapshot | null> {
  try {
    const response = await fetch("/operator-ai-quality-snapshot.json", { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as OperatorAiQualitySnapshot;
  } catch {
    return null;
  }
}

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
      return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
    case "WARN":
      return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
    case "NOT_GENERATED":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}
