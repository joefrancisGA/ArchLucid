"use client";

import { Progress } from "@/components/ui/progress";
import { resolveStepProgressPercent } from "@/lib/step-progress-label";
import { cn } from "@/lib/utils";

export type StepProgressMeterProps = {
  readonly completedCount: number;
  readonly totalCount: number;
  /** Accessible name, e.g. `"First review progress"`. */
  readonly label: string;
  /** Spoken value when the bare percentage would be less useful than the step wording. */
  readonly valueText?: string;
  readonly className?: string;
  readonly testId?: string;
};

/** Omitted rather than passed as `undefined` so the primitive keeps its own computed value label. */
function resolveValueTextProps(valueText: string | undefined): { readonly "aria-valuetext"?: string } {
  return valueText === undefined ? {} : { "aria-valuetext": valueText };
}

/**
 * Shared step-completion meter for first-review and setup progress surfaces.
 * Restrained enterprise treatment: 6px track, teal accent fill, no numerals inside the bar.
 */
export function StepProgressMeter(props: StepProgressMeterProps): React.JSX.Element {
  const percent = resolveStepProgressPercent(props.completedCount, props.totalCount);

  return (
    <Progress
      value={percent}
      aria-label={props.label}
      {...resolveValueTextProps(props.valueText)}
      className={cn("h-1.5 max-w-md bg-neutral-200 dark:bg-neutral-800", props.className)}
      indicatorClassName="bg-[var(--al-accent-interactive)]"
      data-testid={props.testId}
    />
  );
}
