import { cn } from "@/lib/utils";

import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SponsorProofReadinessCopy } from "@/lib/pilot-proof-readiness";

type ProofGateState =
  | { status: "skipped" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok" };

export type EmailRunToSponsorReadinessCopyProps = {
  readonly buyerPolishedShell: boolean;
  readonly proofGate: ProofGateState;
  readonly curatedSampleRun: boolean;
  readonly readinessLoadingPhase: "quick" | "slow";
  readonly readinessCopy: SponsorProofReadinessCopy | null;
};

export function EmailRunToSponsorReadinessCopy({
  buyerPolishedShell,
  proofGate,
  curatedSampleRun,
  readinessLoadingPhase,
  readinessCopy,
}: EmailRunToSponsorReadinessCopyProps) {
  return (
    <>
      <h3 className={cn("m-0 mt-4 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? "Sponsor readiness (sample signals)" : "Sponsor readiness"}
      </h3>

      {proofGate.status === "skipped" ? null : proofGate.status === "loading" && curatedSampleRun ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-sample-static"
        >
          {buyerPolishedShell ? (
            <>
              Sample walkthrough: sponsor readiness lines summarize pilot deltas when telemetry is connected — packages
              below are representative for this review.
            </>
          ) : (
            <>
              Sample review: readiness detail fills in when pilot deltas finish loading — export links below stay
              available for the walkthrough.
            </>
          )}
        </p>
      ) : proofGate.status === "loading" ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-loading"
          aria-busy
        >
          {readinessLoadingPhase === "slow"
            ? "Still preparing sponsor package details — you can use the exports below in the meantime."
            : "Preparing sponsor package details…"}
        </p>
      ) : proofGate.status === "error" ? (
        <p
          className={cn("m-0 mt-2 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-error"
        >
          {buyerPolishedShell
            ? "Could not load every readiness signal — review outputs before sending to sponsors."
            : "Could not load every readiness signal — review the Markdown export above before sponsor send."}
        </p>
      ) : !readinessCopy ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="email-run-to-sponsor-readiness-incomplete"
        >
          {buyerPolishedShell
            ? "Readiness detail expands once pilot telemetry is fully connected."
            : "Readiness detail is unavailable — use the Markdown and ZIP exports on this page as the source of truth."}
        </p>
      ) : (
        <div
          data-testid="email-run-to-sponsor-readiness"
          data-readiness-variant={readinessCopy.variant}
          data-readiness-classification={readinessCopy.classification ?? ""}
          className={
            readinessCopy.variant === "blocked"
              ? cn("mt-2 px-3 py-2", OPERATOR_CALLOUT_WARN_CLASS)
              : readinessCopy.variant === "caveats"
                ? cn("mt-2 px-3 py-2", OPERATOR_CALLOUT_WARN_CLASS)
                : readinessCopy.variant === "ready"
                  ? cn(
                      "mt-2 rounded-md border border-neutral-300 bg-white/90 px-3 py-2 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.body,
                    )
                  : cn(
                      "mt-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.body,
                    )
          }
        >
          <p className="m-0 font-semibold leading-snug">{readinessCopy.title}</p>
          <p className={cn("m-0 mt-1 leading-relaxed opacity-90", OPERATOR_TYPOGRAPHY.helper)}>{readinessCopy.detail}</p>
        </div>
      )}
    </>
  );
}
