"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import {
  useReviewCreationProgress,
  type ReviewCreationProgress,
} from "@/hooks/use-review-creation-progress";
import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import { trackWizardStepViewed, trackWizardValidationFailed } from "@/lib/telemetry";
import { submitQuickFamilyWizardCreateRun } from "@/lib/wizard-form-create-run-submit";
import type { WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  isLastWizardStepIndex,
  nextWizardStepIndex,
  previousWizardStepIndex,
  wizardStepLabelAt,
  type WizardStepDefinition,
  type WizardStepFieldGroup,
} from "@/lib/wizard-step-sequence";

export type QuickFamilyWizardFlowOptions = {
  readonly steps: readonly WizardStepDefinition[];
  /** Telemetry `wizardType`, e.g. `QuickStart`. */
  readonly telemetryWizardName: string;
  readonly blocksLlmExecution: boolean;
  readonly onRunCreated: (runId: string) => void;
  /** RHF fields validated before leaving a step; `null` advances without validating. */
  readonly resolveStepFieldGroup: (stepIndex: number) => WizardStepFieldGroup | null;
  /** Wizard-specific create-run payload knobs, read at submit time so late edits are included. */
  readonly buildPayloadOptions: () => WizardCreateRunPayloadOptions;
  /** Extra async gate before advancing (e.g. persisting baseline metrics); `false` stays on the step. */
  readonly beforeAdvance?: (stepIndex: number) => Promise<boolean>;
  /** Adds the "applying template" stage to create-run progress. */
  readonly hasTemplate?: boolean;
};

export type QuickFamilyWizardFlow = {
  readonly stepIndex: number;
  readonly isFirstStep: boolean;
  /** Last step — the confirm-and-submit step for every wizard in this family. */
  readonly isReviewStep: boolean;
  /** Submitting or waiting on create-run progress. */
  readonly isCreating: boolean;
  readonly canProceed: boolean;
  readonly canSubmit: boolean;
  readonly stepValidationMessage: string | null;
  readonly submitError: unknown | null;
  readonly creationProgress: ReviewCreationProgress;
  readonly goBack: () => void;
  readonly goNext: () => Promise<void>;
  readonly submitRun: () => Promise<void>;
};

/**
 * Step orchestration + create-run submit shared by the `WizardFormValues` "quick family" wizards
 * (QuickStart, SimplifiedPilot): step telemetry, per-step RHF validation, staged progress state,
 * and inline validation/submit error copy. Step content and payload knobs stay with each wizard.
 */
export function useQuickFamilyWizardFlow(
  options: QuickFamilyWizardFlowOptions,
): QuickFamilyWizardFlow {
  const {
    steps,
    telemetryWizardName,
    blocksLlmExecution,
    onRunCreated,
    resolveStepFieldGroup,
    buildPayloadOptions,
    beforeAdvance,
    hasTemplate = false,
  } = options;

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [stepValidationMessage, setStepValidationMessage] = useState<string | null>(null);
  const creationProgress = useReviewCreationProgress();

  const { trigger, getValues } = useFormContext<WizardFormValues>();

  const isReviewStep = isLastWizardStepIndex(stepIndex, steps.length);
  const stepLabel = wizardStepLabelAt(steps, stepIndex);

  useEffect(() => {
    trackWizardStepViewed(stepIndex, stepLabel, telemetryWizardName);

    // A submit failure belongs to the review step; leaving it clears the stale problem panel.
    if (!isLastWizardStepIndex(stepIndex, steps.length)) {
      setSubmitError(null);
    }

    setStepValidationMessage(null);
  }, [stepIndex, stepLabel, steps.length, telemetryWizardName]);

  const isCreating = submitting || creationProgress.isActive;

  const goBack = () => {
    setStepIndex((current) => previousWizardStepIndex(current));
  };

  const advance = () => {
    setStepIndex((current) => nextWizardStepIndex(current, steps.length));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldGroup = resolveStepFieldGroup(stepIndex);

    if (fieldGroup === null) {
      return true;
    }

    const ok = await trigger(fieldGroup, { shouldFocus: true });

    if (ok) {
      return true;
    }

    trackWizardValidationFailed(telemetryWizardName, stepIndex, stepLabel, "field_validation");
    setStepValidationMessage(REVIEW_START_STEP_VALIDATION_MESSAGE);

    return false;
  };

  const goNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    if (beforeAdvance !== undefined && !(await beforeAdvance(stepIndex))) {
      return;
    }

    setStepValidationMessage(null);
    advance();
  };

  const submitRun = async () => {
    await submitQuickFamilyWizardCreateRun({
      trigger,
      getValues,
      blocksLlmExecution,
      payloadOptions: buildPayloadOptions(),
      wizardCompletedName: telemetryWizardName,
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
      progress: creationProgress,
      progressBeginInput: { hasTemplate },
    });
  };

  return {
    stepIndex,
    isFirstStep: stepIndex === 0,
    isReviewStep,
    isCreating,
    canProceed: !isCreating,
    canSubmit: !isCreating && !blocksLlmExecution,
    stepValidationMessage,
    submitError,
    creationProgress,
    goBack,
    goNext,
    submitRun,
  };
}
