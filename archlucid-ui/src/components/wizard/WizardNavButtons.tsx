"use client";

import { Button } from "@/components/ui/button";

export type WizardNavButtonsProps = {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
  /** When false, primary (Next / Submit) is disabled. Defaults to true. */
  canProceed?: boolean;
  isFirstStep?: boolean;
  /** When true, primary action is Submit instead of Next. */
  isLastInputStep?: boolean;
  /** Label for the primary submit action (default: Submit). */
  submitLabel?: string;
  /** Loading label while `submitting` (default: Submitting…). */
  submittingLabel?: string;
};

/**
 * Bottom bar: Back (outline) and Next or Submit (default).
 */
export function WizardNavButtons({
  onBack,
  onNext,
  onSubmit,
  submitting = false,
  canProceed = true,
  isFirstStep = false,
  isLastInputStep = false,
  submitLabel = "Submit",
  submittingLabel = "Submitting…",
}: WizardNavButtonsProps) {
  const showBack = Boolean(onBack) && !isFirstStep;
  const primaryDisabled = !canProceed || submitting;
  const showSubmit = Boolean(onSubmit) && isLastInputStep;
  const showNext = Boolean(onNext) && !isLastInputStep;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="min-h-9">
        {showBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        {showSubmit ? (
          <Button type="button" variant="default" disabled={primaryDisabled} onClick={onSubmit}>
            {submitting ? submittingLabel : submitLabel}
          </Button>
        ) : null}
        {showNext ? (
          <Button type="button" variant="default" disabled={primaryDisabled} onClick={onNext}>
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
