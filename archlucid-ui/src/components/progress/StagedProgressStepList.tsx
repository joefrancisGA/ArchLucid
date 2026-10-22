"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type StagedProgressStep = {
  readonly id: string;
  readonly label: string;
};

export type StagedProgressStepListProps = {
  readonly steps: readonly StagedProgressStep[];
  readonly activeStepIndex: number;
  /** Renders every step as done — used by terminal states where no step is still running. */
  readonly allComplete?: boolean;
  readonly className?: string;
  readonly testId?: string;
};

const STEP_MARKER = {
  complete: "✓ ",
  active: "→ ",
  pending: "· ",
} as const;

function stepMarker(isComplete: boolean, isActive: boolean): string {
  if (isComplete) {
    return STEP_MARKER.complete;
  }

  return isActive ? STEP_MARKER.active : STEP_MARKER.pending;
}

function stepToneClass(isComplete: boolean, isActive: boolean): string {
  if (isActive) {
    return "font-medium text-al-text-primary";
  }

  return isComplete ? "text-al-text-secondary" : "text-al-text-secondary/70";
}

/** Named stage checklist shared by review-start and evidence-processing progress chrome. */
export function StagedProgressStepList(props: StagedProgressStepListProps): React.JSX.Element {
  const allComplete = props.allComplete === true;

  return (
    <ol className={cn("m-0 list-none space-y-1 p-0", props.className)} data-testid={props.testId}>
      {props.steps.map((step, index) => {
        const isComplete = allComplete || index < props.activeStepIndex;
        const isActive = !allComplete && index === props.activeStepIndex;

        return (
          <li
            key={step.id}
            className={cn(OPERATOR_TYPOGRAPHY.helper, stepToneClass(isComplete, isActive))}
            aria-current={isActive ? "step" : undefined}
          >
            {stepMarker(isComplete, isActive)}
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
