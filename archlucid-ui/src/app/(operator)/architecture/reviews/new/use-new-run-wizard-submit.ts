"use client";

import { useCallback, useEffect, useState } from "react";
import type { UseFormGetValues, UseFormTrigger } from "react-hook-form";

import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { isApiRequestError } from "@/lib/api-request-error";
import { isArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import {
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

type ShowToast = (kind: "ok" | "err", message: string) => void;

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
  readonly showToast: ShowToast;
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
  }, [options.stepIndex]);

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
      options.showToast("err", REVIEW_START_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    if (gateFailure === "llm-budget") {
      options.showToast("err", REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);

      return;
    }

    if (gateFailure === "policy-cloud-mismatch") {
      const mismatch = deriveWizardPolicyPackCloudMismatch(options.getValues(), options.payloadOptions);
      options.showToast(
        "err",
        mismatch !== null
          ? `${REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE} ${mismatch}`
          : REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE,
      );

      return;
    }

    setSubmitting(true);
    setSubmitError(null);
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
          options.showToast("err", REVIEW_START_CREATION_FAILED_MESSAGE);

          return;
        }

        if (isArchitectureRequestCreateUnresolvedError(result.error)) {
          creationProgress.markUnresolved();

          return;
        }

        creationProgress.fail(resolveCreateRunFailureMessage(result.error));
        setSubmitError(result.error);

        if (!isApiRequestError(result.error)) {
          const message =
            result.error && typeof result.error === "object" && "message" in result.error
              ? String((result.error as { message?: string }).message)
              : "Request failed.";
          options.showToast("err", message);
        }

        return;
      }

      const id = result.runId;

      creationProgress.succeed();
      options.setRunId(id);
      options.goToStep(TRACK_STEP_INDEX);
      options.clearWizardSession();
      options.showToast("ok", `Architecture review ${id} created — tracking pipeline below.`);

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
        options.showToast("err", result.message);

        return;
      }

      const id = result.runId;
      creationProgress.markResumed();
      options.setRunId(id);
      options.goToStep(TRACK_STEP_INDEX);
      options.clearWizardSession();
      options.showToast("ok", `Architecture review ${id} found — tracking pipeline below.`);

      if (options.hasPendingEvidence) {
        await options.uploadPendingEvidence(id);
      }
    } catch {
      creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
      creationProgress.endRecheck();
      options.showToast("err", REVIEW_START_CREATION_FAILED_MESSAGE);
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
