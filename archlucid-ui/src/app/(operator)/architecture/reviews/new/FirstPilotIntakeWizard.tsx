"use client";

import { cn } from "@/lib/utils";

import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FirstPilotIntakeFields } from "./FirstPilotIntakeFields";
import { FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE } from "./use-first-pilot-intake-submit";
import { useFirstPilotIntakeWizard, type FirstPilotIntakeWizardProps } from "./use-first-pilot-intake-wizard";

export { FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE };

export type { FirstPilotIntakeWizardProps };

/** Single-screen first-pilot intake: review title, evidence upload, optional brief, advanced settings collapsed. */
export function FirstPilotIntakeWizard(props: FirstPilotIntakeWizardProps) {
  const wizard = useFirstPilotIntakeWizard(props);

  return (
    <div className="space-y-5" data-testid="first-pilot-intake-wizard">
      {wizard.wizardSession.pendingRestore !== null && !wizard.suppressWizardResumePrompt ? (
        <WizardSessionResumePrompt
          onResume={wizard.wizardSession.acceptRestore}
          onDismiss={wizard.wizardSession.dismissRestore}
        />
      ) : null}
      {wizard.llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={wizard.llmBudgetStatus} /> : null}
      {wizard.exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={wizard.exampleTemplate} /> : null}
      {wizard.incrementalRereview.priorRunId !== null ? (
        <p
          className={cn("m-0 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="first-pilot-incremental-rereview-hint"
        >
          Incremental re-review after apply — prior package{" "}
          <span className="font-mono">{wizard.incrementalRereview.priorRunId}</span>
          {wizard.incrementalRereview.findingId !== null ? (
            <>
              {" "}
              · focus finding <span className="font-mono">{wizard.incrementalRereview.findingId}</span>
            </>
          ) : null}
        </p>
      ) : null}

      <FirstPilotIntakeFields wizard={wizard} />
    </div>
  );
}
