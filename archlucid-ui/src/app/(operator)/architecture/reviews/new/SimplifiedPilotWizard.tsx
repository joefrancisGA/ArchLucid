"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { WizardStepAdvanced } from "@/components/wizard/steps/WizardStepAdvanced";
import { WizardStepBaselineMetrics } from "@/components/wizard/steps/WizardStepBaselineMetrics";
import { WizardStepBaselineZip } from "@/components/wizard/steps/WizardStepBaselineZip";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { isApiRequestError } from "@/lib/api-request-error";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_SHELL_CONTENT_BLEED_X_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import { SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS } from "@/lib/simplified-pilot-wizard-step-fields";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { submitQuickFamilyWizardCreateRun } from "@/lib/wizard-form-create-run-submit";
import { trackWizardStepViewed, trackWizardValidationFailed } from "@/lib/telemetry";
import { useWizardBaselineMetricsActions } from "@/lib/use-wizard-baseline-metrics-actions";

const PILOT_STEPS = [
  { label: "Start your review", description: "Name the system and describe what you need reviewed" },
  { label: "Optional evidence", description: "Cloud inventory ZIP or supporting files — not required" },
  { label: "Baseline metrics", description: "Capture review-cycle time for sponsor ROI reporting" },
  { label: "Review & submit", description: "Confirm and create the architecture review" },
] as const;

export type SimplifiedPilotWizardProps = {
  llmBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  blocksLlmExecution: boolean;
  onRunCreated: (runId: string) => void;
  onPendingZipFileChange?: (file: File | null) => void;
};

/**
 * Three-step Tier-1 pilot wizard: extractor ZIP → identity/cloud (+ advanced accordion) → review.
 * Reuses the same `WizardFormValues` payload as the full seven-step wizard with preset defaults.
 */
export function SimplifiedPilotWizard(props: SimplifiedPilotWizardProps) {
  const { onRunCreated, llmBudgetStatus, blocksLlmExecution, onPendingZipFileChange } = props;
  const [pilotStep, setPilotStep] = useState(0);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [stepValidationMessage, setStepValidationMessage] = useState<string | null>(null);
  const {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  } = useWizardBaselineMetricsActions();

  const { trigger, getValues, reset } = useFormContext<WizardFormValues>();

  useEffect(() => {
    const greenfieldPreset = wizardPresets.find((preset) => preset.id === "greenfield-web-app");

    if (greenfieldPreset === undefined) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), greenfieldPreset.values));
  }, [reset]);

  useEffect(() => {
    trackWizardStepViewed(pilotStep, PILOT_STEPS[pilotStep]?.label ?? "Unknown", "SimplifiedPilot");
    if (pilotStep !== PILOT_STEPS.length - 1) {
      setSubmitError(null);
    }

    setStepValidationMessage(null);
  }, [pilotStep]);

  const canProceed = !submitting;
  const canSubmit = !submitting && !blocksLlmExecution;

  const goBack = () => {
    setPilotStep((current) => Math.max(0, current - 1));
  };

  const goNext = async () => {
    if (pilotStep === 2) {
      const saved = await persistBaselineMetricsIfNeeded();

      if (!saved) {
        return;
      }

      setPilotStep((current) => Math.min(PILOT_STEPS.length - 1, current + 1));

      return;
    }

    const fieldGroup = SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS[pilotStep];

    if (fieldGroup != null) {
      const ok = await trigger(fieldGroup, { shouldFocus: true });

      if (!ok) {
        trackWizardValidationFailed(
          "SimplifiedPilot",
          pilotStep,
          PILOT_STEPS[pilotStep]?.label ?? "Unknown",
          "field_validation",
        );
        setStepValidationMessage(REVIEW_START_STEP_VALIDATION_MESSAGE);

        return;
      }
    }

    setStepValidationMessage(null);
    setPilotStep((current) => Math.min(PILOT_STEPS.length - 1, current + 1));
  };

  const submitRun = async () => {
    await submitQuickFamilyWizardCreateRun({
      trigger,
      getValues,
      blocksLlmExecution,
      payloadOptions: {
        requestSource: "wizard",
        focusedPilotModeEnabled,
      },
      wizardCompletedName: "SimplifiedPilot",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
    });
  };

  const isReviewStep = pilotStep === PILOT_STEPS.length - 1;
  const isFirstStep = pilotStep === 0;

  return (
    <div className="space-y-4 pb-36" data-testid="simplified-pilot-wizard">
      {isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
      ) : null}
      <div className="space-y-1" data-testid="simplified-pilot-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
          Pilot wizard — step {pilotStep + 1} of {PILOT_STEPS.length}: {PILOT_STEPS[pilotStep].label}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PILOT_STEPS[pilotStep].description}</p>
      </div>

      {pilotStep === 0 ? (
        <div className="space-y-8">
          <PilotModePolicyPackToggle
            enabled={focusedPilotModeEnabled}
            onEnabledChange={setFocusedPilotModeEnabled}
          />
          <WizardStepIdentity />
          <WizardStepDescription />
          <AdvancedOptionsAccordion triggerLabel="Advanced configuration">
            <WizardStepConstraints />
            <WizardStepAdvanced />
          </AdvancedOptionsAccordion>
        </div>
      ) : null}
      {pilotStep === 1 ? (
        <WizardStepBaselineZip onPendingZipFileChange={onPendingZipFileChange} />
      ) : null}
      {pilotStep === 2 ? (
        <WizardStepBaselineMetrics
          reviewCycleHours={baselineReviewCycleHours}
          confidence={baselineConfidence}
          fieldError={baselineMetricsError}
          onReviewCycleHoursChange={(value) => {
            setBaselineReviewCycleHours(value);

            if (baselineMetricsError !== null) {
              setBaselineMetricsError(null);
            }
          }}
          onConfidenceChange={setBaselineConfidence}
        />
      ) : null}
      {isReviewStep ? <WizardStepReview /> : null}

      <div
        className={cn(
          "sticky bottom-0 z-10 mt-8 border-t border-neutral-200/60 bg-neutral-50/98 py-3 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 dark:border-neutral-800/60 dark:bg-neutral-950/98 dark:shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.25)] dark:supports-[backdrop-filter]:bg-neutral-950/85",
          OPERATOR_SHELL_CONTENT_BLEED_X_CLASS,
        )}
        data-testid="simplified-pilot-footer"
      >
        {stepValidationMessage !== null ? (
          <div className="mb-3" data-testid="simplified-pilot-validation-error">
            <ReviewStartInlineError message={stepValidationMessage} />
          </div>
        ) : null}
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
