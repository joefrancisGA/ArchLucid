"use client"
import { cn } from "@/lib/utils";

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

const PROGRESS_MAX = 100;

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
};

/** Keeps out-of-range inputs from dropping `aria-valuenow` (Radix rejects values above `max`). */
function clampProgressValue(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(PROGRESS_MAX, Math.max(0, value));
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, indicatorClassName, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
  const hasLabelledBy = typeof ariaLabelledBy === "string" && ariaLabelledBy.trim().length > 0;
  const hasLabel = typeof ariaLabel === "string" && ariaLabel.trim().length > 0;
  const clampedValue = clampProgressValue(value);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={clampedValue}
      max={PROGRESS_MAX}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-neutral-900/20 dark:bg-neutral-50/20",
        className
      )}
      aria-labelledby={hasLabelledBy ? ariaLabelledBy : undefined}
      aria-label={hasLabelledBy ? undefined : hasLabel ? ariaLabel : "Progress"}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-neutral-900 transition-all motion-reduce:transition-none dark:bg-neutral-50",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${PROGRESS_MAX - (clampedValue ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress }
