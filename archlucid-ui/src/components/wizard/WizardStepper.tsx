import { cn } from "@/lib/utils";

export type WizardStepDefinition = {
  label: string;
  description?: string;
};

export type WizardStepperProps = {
  /** Step metadata in order. */
  steps: WizardStepDefinition[];
  /** Zero-based index of the active step (`aria-current="step"` on that step). */
  currentStep: number;
  /** Zero-based indices of steps already completed. */
  completedSteps: number[];
};

/**
 * Horizontal wizard progress: numbered circles with labels, teal accent aligned with operator primary link (#0f766e).
 */
export function WizardStepper({ steps, currentStep, completedSteps }: WizardStepperProps) {
  const completed = new Set(completedSteps);

  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="m-0 flex w-full list-none flex-wrap items-start gap-3 p-0 md:gap-6">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = completed.has(index);

          return (
            <li
              key={`${step.label}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isActive && "border-teal-700 bg-teal-700 text-white",
                  !isActive &&
                    isDone &&
                    "border-teal-700 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100",
                  !isActive &&
                    !isDone &&
                    "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-300",
                )}
              >
                {index + 1}
              </span>
              <span className="max-w-[10rem] text-xs font-medium text-neutral-800 dark:text-neutral-200 md:text-sm">
                {step.label}
              </span>
              {step.description ? (
                <span className="hidden max-w-[12rem] text-xs text-neutral-500 dark:text-neutral-300 md:block">
                  {step.description}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
