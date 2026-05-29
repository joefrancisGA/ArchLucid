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
      return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
    case "WARN":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "BLOCK":
      return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100";
    case "NOT_RUN":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}
