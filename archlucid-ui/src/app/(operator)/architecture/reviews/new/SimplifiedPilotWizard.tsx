"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { FocusedPilotScopeDisclosureBanner } from "@/components/wizard/FocusedPilotScopeDisclosureBanner";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { WizardStickyFooter } from "@/components/wizard/WizardStickyFooter";
import { WizardStepAdvanced } from "@/components/wizard/steps/WizardStepAdvanced";
import { WizardStepBaselineMetrics } from "@/components/wizard/steps/WizardStepBaselineMetrics";
import { WizardStepBaselineZip } from "@/components/wizard/steps/WizardStepBaselineZip";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useQuickFamilyWizardFlow } from "@/hooks/use-quick-family-wizard-flow";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS } from "@/lib/simplified-pilot-wizard-step-fields";
import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import type { WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import type { WizardStepDefinition, WizardStepFieldGroup } from "@/lib/wizard-step-sequence";
import { useWizardBaselineMetricsActions } from "@/lib/use-wizard-baseline-metrics-actions";

const PILOT_STEPS: readonly WizardStepDefinition[] = [
  { label: "Start your review", description: "Name the system and describe what you need reviewed" },
  { label: "Optional evidence", description: "Cloud inventory ZIP or supporting files — not required" },
  { label: "Baseline metrics", description: "Capture review-cycle time for sponsor ROI reporting" },
  { label: "Review & submit", description: "Confirm and create the architecture review" },
];

const BASELINE_METRICS_STEP_INDEX = 2;

function simplifiedPilotStepFieldGroup(stepIndex: number): WizardStepFieldGroup | null {
  return SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS[stepIndex] ?? null;
}

export type SimplifiedPilotWizardProps = {
  llmBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  blocksLlmExecution: boolean;
  onRunCreated: (runId: string) => void;
  onPendingZipFileChange?: (file: File | null) => void;
};

/**
 * Four-step Tier-1 pilot wizard: identity/brief (+ advanced accordion) → optional evidence ZIP →
 * baseline metrics → review. Reuses the same `WizardFormValues` payload as the full wizard.
 */
export function SimplifiedPilotWizard(props: SimplifiedPilotWizardProps) {
  const { onRunCreated, llmBudgetStatus, blocksLlmExecution, onPendingZipFileChange } = props;
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  } = useWizardBaselineMetricsActions();

  const { reset } = useFormContext<WizardFormValues>();

  const buildPayloadOptions = (): WizardCreateRunPayloadOptions => ({
    requestSource: "wizard",
    focusedPilotModeEnabled,
  });

  /** Baseline capture is persisted on its own endpoint before the review step opens. */
  const beforeAdvance = async (stepIndex: number): Promise<boolean> => {
    if (stepIndex !== BASELINE_METRICS_STEP_INDEX) {
      return true;
    }

    return persistBaselineMetricsIfNeeded();
  };

  const flow = useQuickFamilyWizardFlow({
    steps: PILOT_STEPS,
    telemetryWizardName: "SimplifiedPilot",
    blocksLlmExecution,
    onRunCreated,
    resolveStepFieldGroup: simplifiedPilotStepFieldGroup,
    buildPayloadOptions,
    beforeAdvance,
  });

  useEffect(() => {
    const greenfieldPreset = wizardPresets.find((preset) => preset.id === "greenfield-web-app");

    if (greenfieldPreset === undefined) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), greenfieldPreset.values));
  }, [reset]);

  return (
    <div className="space-y-4 pb-36" data-testid="simplified-pilot-wizard">
      {isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
      ) : null}
      <WizardStepHeading
        wizardLabel="Pilot wizard"
        stepIndex={flow.stepIndex}
        steps={PILOT_STEPS}
        testId="simplified-pilot-progress"
      />

      {flow.stepIndex === 0 ? (
        <div className={OPERATOR_LAYOUT.sectionStack}>
          <PilotModePolicyPackToggle
            enabled={focusedPilotModeEnabled}
            onEnabledChange={setFocusedPilotModeEnabled}
          />
          <FocusedPilotScopeDisclosureBanner focusedModeEnabled={focusedPilotModeEnabled} />
          <WizardStepIdentity />
          <WizardStepDescription />
          <AdvancedOptionsAccordion triggerLabel="Advanced configuration">
            <WizardStepConstraints />
            <WizardStepAdvanced />
          </AdvancedOptionsAccordion>
        </div>
      ) : null}
      {flow.stepIndex === 1 ? (
        <WizardStepBaselineZip onPendingZipFileChange={onPendingZipFileChange} />
      ) : null}
      {flow.stepIndex === BASELINE_METRICS_STEP_INDEX ? (
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
      {flow.isReviewStep ? (
        <WizardStepReview focusedPilotModeEnabled={focusedPilotModeEnabled} />
      ) : null}

      <WizardStickyFooter
        testIdPrefix="simplified-pilot"
        progress={flow.creationProgress}
        onRecheck={() => {
          void flow.submitRun();
        }}
        stepValidationMessage={flow.stepValidationMessage}
        submitError={flow.submitError}
        showSubmitError={flow.isReviewStep}
      >
        <WizardNavButtons
          onBack={flow.goBack}
          onNext={flow.isReviewStep ? undefined : flow.goNext}
          onSubmit={flow.isReviewStep ? flow.submitRun : undefined}
          onSaveDraft={undefined}
          submitting={flow.isCreating}
          canProceed={flow.canProceed}
          canSubmit={flow.canSubmit}
          isFirstStep={flow.isFirstStep}
          isLastInputStep={flow.isReviewStep}
          nextLabel="Next"
          submitLabel="Start Architecture Review"
          submittingLabel="Creating…"
        />
      </WizardStickyFooter>
    </div>
  );
}
