"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewSubmitPhaseId = "mapping" | "policy" | "findings";

export type ReviewSubmitPhaseProgressProps = {
  readonly activePhase: ReviewSubmitPhaseId;
  readonly minutesEstimate?: string;
  readonly className?: string;
};

const PHASES: readonly { id: ReviewSubmitPhaseId; label: string }[] = [
  { id: "mapping", label: "Mapping architecture structure" },
  { id: "policy", label: "Checking policy" },
  { id: "findings", label: "Drafting findings" },
];

function phaseIndex(phase: ReviewSubmitPhaseId): number {
  return PHASES.findIndex((row) => row.id === phase);
}

/** Named pipeline phases shown while a review is being created — sets honest time-to-value expectations. */
export function ReviewSubmitPhaseProgress(props: ReviewSubmitPhaseProgressProps): React.JSX.Element {
  const activeIndex = Math.max(0, phaseIndex(props.activePhase));
  const progressValue = Math.round(((activeIndex + 1) / PHASES.length) * 100);

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-700",
        props.className,
      )}
      data-testid="review-submit-phase-progress"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Starting your review…
      </p>
      {props.minutesEstimate !== undefined ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          {props.minutesEstimate}
        </p>
      ) : null}
      <Progress value={progressValue} className="mt-3 h-2" aria-hidden />
      <ol className="m-0 mt-3 list-none space-y-1 p-0">
        {PHASES.map((phase, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <li
              key={phase.id}
              className={cn(
                OPERATOR_TYPOGRAPHY.helper,
                isActive ? "font-medium text-al-text-primary" : isComplete ? "text-al-text-secondary" : "text-al-text-secondary/70",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? "✓ " : isActive ? "→ " : "· "}
              {phase.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
