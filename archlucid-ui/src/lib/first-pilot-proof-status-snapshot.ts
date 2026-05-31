export type FirstPilotProofStatusDisposition = "PASS" | "WARN" | "BLOCK" | "NOT_RUN";

export type FirstPilotProofStatusSnapshot = {
  readonly generatedUtc: string;
  readonly disposition: FirstPilotProofStatusDisposition;
  readonly verdict: string;
  readonly blockCount: number;
  readonly warnCount: number;
  readonly nextAction: string;
  readonly proofFolder: string | null;
  readonly remediationLinks: readonly {
    readonly label: string;
    readonly path: string;
  }[];
};

export function proofStatusDispositionClass(disposition: FirstPilotProofStatusDisposition): string {
  switch (disposition) {
    case "PASS":
      return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
    case "WARN":
      return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
    case "BLOCK":
      return "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50";
    case "NOT_RUN":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}
