"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type WizardSessionResumePromptProps = {
  readonly onResume: () => void;
  readonly onDismiss: () => void;
};

/** Offers to restore an in-progress wizard from session storage (TB-2157). */
export function WizardSessionResumePrompt(props: WizardSessionResumePromptProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/60",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="wizard-session-resume-prompt"
    >
      <p className="m-0 font-semibold text-al-text-primary">Resume where you left off?</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        This browser saved your in-progress wizard. Resume to restore your fields, or start fresh.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="primary" onClick={props.onResume}>
          Resume
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onDismiss}>
          Start fresh
        </Button>
      </div>
    </div>
  );
}
