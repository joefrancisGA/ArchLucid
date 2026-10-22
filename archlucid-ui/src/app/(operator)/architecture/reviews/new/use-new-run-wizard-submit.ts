"use client";

import { useCallback, useEffect, useState } from "react";
import type { UseFormGetValues, UseFormTrigger } from "react-hook-form";

import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { isArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import {
  describeCoveragePackOverrideBlocker,
  evaluateWizardFormCreateRunGates,
  executeWizardFormCreateRun,
  resolveCreateRunFailureMessage,
} from "@/lib/wizard-form-create-run-submit";
import { recheckUnresolvedArchitectureReviewCreate } from "@/lib/review-start-unresolved-recheck";
import { wizardValuesToCreateRunPayload, type WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE,
  REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE,
  REVIEW_START_SUBMIT_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import { deriveWizardPolicyPackCloudMismatch } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

import { REVIEW_STEP_INDEX, TRACK_STEP_INDEX } from "./new-run-wizard-steps";

type UseNewRunWizardSubmitOptions = {
  readonly trigger: UseFormTrigger<WizardFormValues>;
  readonly getValues: UseFormGetValues<WizardFormValues>;
  readonly blocksLlmExecution: boolean;
  readonly payloadOptions: WizardCreateRunPayloadOptions;
  readonly presetDeeplinkToken: string | null;
  readonly policyPackCloudMismatch: string | null;
  readonly stepIndex: number;
  readonly goToStep: (index: number) => void;
  readonly setRunId: (runId: string) => void;
  readonly setStepValidationMessage: (message: string | null) => void;
  readonly clearWizardSession: () => void;
  readonly hasPendingEvidence: boolean;
  readonly uploadPendingEvidence: (runId: string) => Promise<void>;
};

export function useNewRunWizardSubmit(options: UseNewRunWizardSubmitOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const creationProgress = useReviewCreationProgress();

  useEffect(() => {
    if (options.stepIndex !== REVIEW_STEP_INDEX) {
      setSubmitError(null);
    }

    options.setStepValidationMessage(null);
  }, [options.stepIndex, options.setStepValidationMessage]);

  const isCreating = submitting || creationProgress.isActive;
  const canProceed = !isCreating;
  const canSubmit =
    !isCreating && !options.blocksLlmExecution && options.policyPackCloudMismatch === null;

  const submitRun = useCallback(async () => {
    const gateFailure = await evaluateWizardFormCreateRunGates({
      trigger: options.trigger,
      blocksLlmExecution: options.blocksLlmExecution,
      getValues: options.getValues,
      payloadOptions: options.payloadOptions,
    });

    if (gateFailure === "validation") {
      options.setStepValidationMessage(REVIEW_START_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    if (gateFailure === "llm-budget") {
      options.setStepValidationMessage(REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);

      return;
    }

    if (gateFailure === "policy-cloud-mismatch") {
      const mismatch = deriveWizardPolicyPackCloudMismatch(options.getValues(), options.payloadOptions);
      options.setStepValidationMessage(
        mismatch !== null
          ? `${REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE} ${mismatch}`
          : REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE,
      );

      return;
    }

    const overrideBlocker = describeCoveragePackOverrideBlocker();

    if (overrideBlocker !== null) {
      options.setStepValidationMessage(overrideBlocker);

      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    options.setStepValidationMessage(null);
    creationProgress.begin({ hasTemplate: options.presetDeeplinkToken !== null });

    try {
      const result = await executeWizardFormCreateRun({
        getValues: options.getValues,
        payloadOptions: options.payloadOptions,
        wizardCompletedName: "FullGuided",
        progress: creationProgress,
      });

      if (!result.ok) {
        if (result.reason === "no-run-id") {
          creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
          setSubmitError(new Error(REVIEW_START_CREATION_FAILED_MESSAGE));

          return;
        }

        if (isArchitectureRequestCreateUnresolvedError(result.error)) {
          creationProgress.markUnresolved();

          return;
        }

        creationProgress.fail(resolveCreateRunFailureMessage(result.error));
        setSubmitError(result.error ?? new Error(REVIEW_START_CREATION_FAILED_MESSAGE));

        return;
      }

      const id = result.runId;

      creationProgress.succeed();
      options.setRunId(id);
      options.goToStep(TRACK_STEP_INDEX);
      options.clearWizardSession();

      if (options.hasPendingEvidence) {
        await options.uploadPendingEvidence(id);
      }
    } finally {
      setSubmitting(false);
    }
  }, [creationProgress, options]);

  const recheckUnresolvedRun = useCallback(async () => {
    if (creationProgress.outcome?.kind !== "unresolved") {
      return;
    }

    creationProgress.beginRecheck();

    try {
      const body = wizardValuesToCreateRunPayload(options.getValues(), options.payloadOptions);
      const result = await recheckUnresolvedArchitectureReviewCreate(body);

      if (result.status === "still-unresolved") {
        creationProgress.endRecheck();

        return;
      }

      if (result.status === "failed") {
        creationProgress.fail(result.message);
        creationProgress.endRecheck();
        setSubmitError(new Error(result.message));

        return;
      }

      const id = result.runId;
      creationProgress.markResumed();
      options.setRunId(id);
      options.goToStep(TRACK_STEP_INDEX);
      options.clearWizardSession();

      if (options.hasPendingEvidence) {
        await options.uploadPendingEvidence(id);
      }
    } catch {
      creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
      creationProgress.endRecheck();
      setSubmitError(new Error(REVIEW_START_CREATION_FAILED_MESSAGE));
    }
  }, [creationProgress, options]);

  return {
    submitting,
    submitError,
    creationProgress,
    isCreating,
    canProceed,
    canSubmit,
    submitRun,
    recheckUnresolvedRun,
  };
}
