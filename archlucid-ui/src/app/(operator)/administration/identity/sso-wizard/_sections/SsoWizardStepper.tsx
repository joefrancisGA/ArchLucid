"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WIZARD_STICKY_PROGRESS_CLASS } from "@/lib/wizard-sticky-progress";

import { SSO_WIZARD_STEPS } from "./sso-wizard-state";

export type SsoWizardStepperProps = {
  readonly currentStep: number;
  readonly completedSteps: readonly number[];
  readonly onStepSelect?: (stepIndex: number) => void;
  /** Keep the step rail visible under the operator shell while scrolling (TB-2198). Defaults to true. */
  readonly sticky?: boolean;
};

export function SsoWizardStepper(props: SsoWizardStepperProps): React.JSX.Element {
  const sticky = props.sticky !== false;
  const completed = new Set(props.completedSteps);
  const stepPositionLabel = `Step ${props.currentStep + 1} of ${SSO_WIZARD_STEPS.length}`;

  return (
    <nav
      aria-label="SSO configuration progress"
      data-testid="sso-wizard-stepper"
      className={cn(sticky && WIZARD_STICKY_PROGRESS_CLASS)}
    >
      <p className="sr-only" aria-live="polite" data-testid="sso-wizard-step-announcement">
        {stepPositionLabel}
        {completed.has(props.currentStep) ? " — completed" : ""}
      </p>
      <p className={cn("m-0 mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
        {stepPositionLabel}
      </p>
      <ol className="m-0 flex w-full list-none flex-col gap-4 p-0 sm:flex-row sm:items-start sm:gap-2">
        {SSO_WIZARD_STEPS.map((step, index) => {
          const isActive = index === props.currentStep;
          const isDone = completed.has(index);
          const isFuture = !isActive && !isDone;
          const stepNumber = index + 1;
          const isNavigable = isDone && !isActive && props.onStepSelect !== undefined;
          const stepButtonId = `sso-wizard-step-${index}`;

          return (
            <li
              key={step.label}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
              aria-current={isActive ? "step" : undefined}
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 top-[1.125rem] hidden h-0.5 w-full -translate-y-1/2 sm:block",
                    isDone || isActive ? "bg-teal-700 dark:bg-teal-500" : "bg-neutral-300 dark:bg-neutral-600",
                  )}
                />
              ) : null}

              {isNavigable ? (
                <button
                  id={stepButtonId}
                  type="button"
                  className={cn(
                    "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                    "border-teal-700 bg-teal-50 text-teal-900 hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100",
                  )}
                  aria-label={`${step.label}, completed. Go to step ${stepNumber}.`}
                  data-testid={`sso-wizard-step-button-${index}`}
                  onClick={() => props.onStepSelect?.(index)}
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <span
                  id={stepButtonId}
                  className={cn(
                    "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                    isActive && "border-teal-700 bg-teal-700 text-white shadow-sm dark:border-teal-500 dark:bg-teal-600",
                    isDone &&
                      !isActive &&
                      "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100",
                    isFuture &&
                      "border-neutral-300 bg-white text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200",
                  )}
                  aria-hidden={isActive ? undefined : true}
                >
                  {isDone && !isActive ? <Check className="h-4 w-4" aria-hidden /> : stepNumber}
                </span>
              )}

              <span className="sr-only">
                {step.label}
                {isDone ? " — completed" : isActive ? " — current step" : ""}
              </span>

              <span
                className={cn(
                  "mt-2 font-medium",
                  OPERATOR_TYPOGRAPHY.body,
                  isActive && "text-al-text-primary",
                  isDone && !isActive && "text-al-text-primary",
                  isFuture && "text-al-text-secondary",
                )}
              >
                {step.label}
              </span>

              {step.description ? (
                <span
                  className={cn(
                    "mt-1 max-w-[11rem]",
                    OPERATOR_TYPOGRAPHY.helper,
                    isActive ? "text-al-text-secondary" : "text-al-text-secondary/90",
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
