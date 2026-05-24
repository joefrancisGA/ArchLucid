"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepAdvanced } from "@/components/wizard/steps/WizardStepAdvanced";
import { WizardStepBaselineZip } from "@/components/wizard/steps/WizardStepBaselineZip";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { createArchitectureRun } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS } from "@/lib/simplified-pilot-wizard-step-fields";
import { showError, showSuccess } from "@/lib/toast";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { wizardValuesToCreateRunPayload } from "@/lib/wizard-payload";

const PILOT_STEPS = [
  { label: "Upload extractor ZIP", description: "Packager output (read-only inventory)" },
  { label: "System & cloud", description: "Name your system and optional advanced configuration" },
  { label: "Review & submit", description: "Confirm and create the architecture review" },
] as const;

export type SimplifiedPilotWizardProps = {
  llmBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  blocksLlmExecution: boolean;
  onRunCreated: (runId: string) => void;
};

/**
 * Three-step Tier-1 pilot wizard: extractor ZIP → identity/cloud (+ advanced accordion) → review.
 * Reuses the same `WizardFormValues` payload as the full seven-step wizard with preset defaults.
 */
export function SimplifiedPilotWizard(props: SimplifiedPilotWizardProps) {
  const { onRunCreated, llmBudgetStatus, blocksLlmExecution } = props;
  const [pilotStep, setPilotStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);

  const { trigger, getValues, reset } = useFormContext<WizardFormValues>();

  useEffect(() => {
    const greenfieldPreset = wizardPresets.find((preset) => preset.id === "greenfield-web-app");

    if (greenfieldPreset === undefined) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), greenfieldPreset.values));
  }, [reset]);

  useEffect(() => {
    if (pilotStep !== 2) {
      setSubmitError(null);
    }
  }, [pilotStep]);

  const canProceed = !submitting;
  const canSubmit = !submitting && !blocksLlmExecution;

  const showToast = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      showSuccess(message);
    } else {
      showError("Pilot wizard", message);
    }
  }, []);

  const goBack = () => {
    setPilotStep((current) => Math.max(0, current - 1));
  };

  const goNext = async () => {
    const fieldGroup = SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS[pilotStep];

    if (fieldGroup != null) {
      const ok = await trigger(fieldGroup, { shouldFocus: true });

      if (!ok) {
        showToast("err", "Fix the highlighted fields before continuing.");

        return;
      }
    }

    setPilotStep((current) => Math.min(PILOT_STEPS.length - 1, current + 1));
  };

  const submitRun = async () => {
    const ok = await trigger(undefined, { shouldFocus: true });

    if (!ok) {
      showToast("err", "Fix validation errors before creating the architecture review.");

      return;
    }

    if (blocksLlmExecution) {
      showToast("err", "LLM Execution budget exceeded for this month. You may still view previous runs.");

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = wizardValuesToCreateRunPayload(getValues());
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (id === null) {
        showToast("err", "API returned no architecture review id.");

        return;
      }

      recordFirstTenantFunnelEvent("first_run_started");
      showToast("ok", `Architecture review ${id} created — tracking pipeline below.`);
      onRunCreated(id);
    } catch (error: unknown) {
      setSubmitError(error);

      if (!isApiRequestError(error)) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Request failed.";
        showToast("err", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isReviewStep = pilotStep === 2;
  const isFirstStep = pilotStep === 0;

  return (
    <div className="space-y-4 pb-36" data-testid="simplified-pilot-wizard">
      {!isBuyerPolishedOperatorShellEnv() && llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
      ) : null}
      <div className="space-y-1" data-testid="simplified-pilot-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
          Pilot wizard — step {pilotStep + 1} of {PILOT_STEPS.length}: {PILOT_STEPS[pilotStep].label}
        </p>
        <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">{PILOT_STEPS[pilotStep].description}</p>
      </div>

      {pilotStep === 0 ? <WizardStepBaselineZip /> : null}
      {pilotStep === 1 ? (
        <div className="space-y-8">
          <WizardStepIdentity />
          <WizardStepDescription />
          <AdvancedOptionsAccordion triggerLabel="Advanced configuration">
            <WizardStepConstraints />
            <WizardStepAdvanced />
          </AdvancedOptionsAccordion>
        </div>
      ) : null}
      {pilotStep === 2 ? <WizardStepReview /> : null}

      <div
        className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-neutral-200/60 bg-neutral-50/98 px-4 py-3 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 dark:border-neutral-800/60 dark:bg-neutral-950/98 dark:shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.25)] dark:supports-[backdrop-filter]:bg-neutral-950/85 lg:-mx-6 lg:px-6"
        data-testid="simplified-pilot-footer"
      >
        {isReviewStep && submitError !== null ? (
          <div className="mb-3" data-testid="simplified-pilot-submit-error">
            {isApiRequestError(submitError) ? (
              <OperatorApiProblem
                problem={submitError.problem}
                fallbackMessage={submitError.message}
                correlationId={submitError.correlationId}
                httpStatus={submitError.httpStatus}
                retryAfterSeconds={submitError.retryAfterSeconds}
              />
            ) : (
              <OperatorApiProblem
                problem={null}
                fallbackMessage={
                  submitError && typeof submitError === "object" && "message" in submitError
                    ? String((submitError as { message?: string }).message)
                    : "Request failed."
                }
              />
            )}
          </div>
        ) : null}
        <WizardNavButtons
          onBack={goBack}
          onNext={isReviewStep ? undefined : goNext}
          onSubmit={isReviewStep ? submitRun : undefined}
          onSaveDraft={undefined}
          submitting={submitting}
          canProceed={canProceed}
          canSubmit={canSubmit}
          isFirstStep={isFirstStep}
          isLastInputStep={isReviewStep}
          nextLabel="Next"
          submitLabel="Start Architecture Review"
          submittingLabel="Creating…"
        />
      </div>
    </div>
  );
}
