import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WIZARD_STICKY_PROGRESS_CLASS,
  WIZARD_STICKY_PROGRESS_TEST_ID,
} from "@/lib/wizard-sticky-progress";

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
  /**
   * Keep the step rail visible under the operator shell while the wizard body scrolls.
   * Defaults to true for operator wizards (TB-2198).
   */
  sticky?: boolean;
  className?: string;
};

/**
 * Horizontal wizard progress: numbered circles with labels, teal accent aligned with operator primary link (#0f766e).
 */
export function WizardStepper({
  steps,
  currentStep,
  completedSteps,
  sticky = true,
  className,
}: WizardStepperProps) {
  const completed = new Set(completedSteps);

  return (
    <nav
      aria-label="Wizard progress"
      className={cn("w-full", sticky && WIZARD_STICKY_PROGRESS_CLASS, className)}
      data-testid={sticky ? WIZARD_STICKY_PROGRESS_TEST_ID : undefined}
    >
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
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                  OPERATOR_TYPOGRAPHY.cardTitle,
                  isActive && "border-teal-700 bg-teal-700 text-white",
                  !isActive &&
                    isDone &&
                    "border-neutral-400 bg-[var(--al-layer-hover)] text-al-text-primary dark:bg-neutral-800/80",
                  !isActive &&
                    !isDone &&
                    "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-300",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "max-w-[10rem] font-medium text-neutral-800 dark:text-neutral-200 md:",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span
                  className={cn(
                    "hidden max-w-[12rem] text-neutral-500 dark:text-neutral-300 md:block",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                >
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