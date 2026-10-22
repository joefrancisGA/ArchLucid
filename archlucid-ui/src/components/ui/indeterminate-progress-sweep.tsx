"use client";

import { cn } from "@/lib/utils";

export type IndeterminateProgressSweepProps = {
  readonly label: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Indeterminate progress bar — no aria-valuenow because progress is not measurable. */
export function IndeterminateProgressSweep(props: IndeterminateProgressSweepProps): React.JSX.Element {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800", props.className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={props.label}
      data-testid={props.testId ?? "indeterminate-progress-sweep"}
    >
      <div className="al-indeterminate-sweep h-full w-1/3 rounded-full bg-[var(--al-accent-interactive)]" />
    </div>
  );
}
