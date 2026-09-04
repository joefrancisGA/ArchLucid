"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  useReviewCreationProgress,
  type ReviewCreationProgress,
} from "@/hooks/use-review-creation-progress";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import { trackWizardValidationFailed } from "@/lib/telemetry";
import { submitQuickFamilyWizardCreateRun, recheckQuickFamilyWizardCreateRun } from "@/lib/wizard-form-create-run-submit";
import { deriveWizardPolicyPackCloudMismatch, type WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  isLastWizardStepIndex,
  nextWizardStepIndex,
  previousWizardStepIndex,
  type WizardStepDefinition,
  type WizardStepFieldGroup,
} from "@/lib/wizard-step-sequence";
import {
  parseQuickFamilyWizardStepFromSearch,
  quickFamilyWizardStepHrefFromSearch,
} from "@/lib/runs/quick-family-wizard-step-url";

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
  readonly recheckUnresolvedRun: () => Promise<void>;
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

  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const urlQsStep = parseQuickFamilyWizardStepFromSearch(searchParams.get("qsStep"));

  const navigation = useWizardStepNavigation({
    steps,
    telemetryWizardName,
    initialStepIndex: urlQsStep ?? 0,
  });

  const syncQsStepToUrl = useCallback(
    (stepIndex: number) => {
      router.replace(quickFamilyWizardStepHrefFromSearch(searchParams.toString(), stepIndex, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const fromUrl = parseQuickFamilyWizardStepFromSearch(searchParams.get("qsStep"));

    if (fromUrl !== null && fromUrl !== navigation.stepIndex) {
      navigation.goToStep(fromUrl);
    }
  }, [navigation.goToStep, navigation.stepIndex, searchParams]);

  const goBack = useCallback(() => {
    const next = previousWizardStepIndex(navigation.stepIndex);
    navigation.goToStep(next);
    syncQsStepToUrl(next);
  }, [navigation, syncQsStepToUrl]);

  const advanceWithUrl = useCallback(() => {
    const next = nextWizardStepIndex(navigation.stepIndex, steps.length);
    navigation.goToStep(next);
    syncQsStepToUrl(next);
  }, [navigation, steps.length, syncQsStepToUrl]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [stepValidationMessage, setStepValidationMessage] = useState<string | null>(null);
  const creationProgress = useReviewCreationProgress();

  const { trigger, getValues, control } = useFormContext<WizardFormValues>();
  const watchedValues = useWatch({ control }) as WizardFormValues | undefined;

  const policyPackCloudMismatch = useMemo(() => {
    const values = watchedValues ?? getValues();

    return deriveWizardPolicyPackCloudMismatch(values, buildPayloadOptions());
  }, [buildPayloadOptions, getValues, watchedValues]);

  const isReviewStep = navigation.isReviewStep;

  useEffect(() => {
    // A submit failure belongs to the review step; leaving it clears the stale problem panel.
    if (!isLastWizardStepIndex(navigation.stepIndex, steps.length)) {
      setSubmitError(null);
    }

    setStepValidationMessage(null);
  }, [navigation.stepIndex, steps.length]);

  const isCreating = submitting || creationProgress.isActive;

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldGroup = resolveStepFieldGroup(navigation.stepIndex);

    if (fieldGroup === null) {
      return true;
    }

    const ok = await trigger(fieldGroup, { shouldFocus: true });

    if (ok) {
      return true;
    }

    trackWizardValidationFailed(
      telemetryWizardName,
      navigation.stepIndex,
      navigation.stepLabel,
      "field_validation",
    );
    setStepValidationMessage(REVIEW_START_STEP_VALIDATION_MESSAGE);

    return false;
  };

  const goNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    if (beforeAdvance !== undefined && !(await beforeAdvance(navigation.stepIndex))) {
      return;
    }

    setStepValidationMessage(null);
    advanceWithUrl();
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

  const recheckUnresolvedRun = async () => {
    await recheckQuickFamilyWizardCreateRun({
      getValues,
      payloadOptions: buildPayloadOptions(),
      onRunFound: onRunCreated,
      progress: creationProgress,
    });
  };

  return {
    stepIndex: navigation.stepIndex,
    isFirstStep: navigation.isFirstStep,
    isReviewStep,
    isCreating,
    canProceed: !isCreating,
    canSubmit: !isCreating && !blocksLlmExecution && policyPackCloudMismatch === null,
    stepValidationMessage,
    submitError,
    creationProgress,
    goBack,
    goNext,
    submitRun,
    recheckUnresolvedRun,
  };
}
