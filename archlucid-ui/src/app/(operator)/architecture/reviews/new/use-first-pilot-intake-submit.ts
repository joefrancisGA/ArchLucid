"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";

import { REVIEW_CREATION_PROGRESS_TIMEOUT_MS, type ReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import type { CreateArchitectureRunDocumentPayload } from "@/lib/api/architecture-runs-mutate";
import { isArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { isApiRequestError } from "@/lib/api-request-error";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture/architecture-request-limits";
import { describeFirstPilotStartBlocker, type FirstPilotStartBlockerInput } from "@/lib/first-pilot-intake";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import {
  reviewPipelineOperationId,
  trackReviewPipelineInFlight,
} from "@/lib/operations/review-pipeline-in-flight";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { REVIEW_START_CREATION_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";
import { recheckUnresolvedArchitectureReviewCreate } from "@/lib/review-start-unresolved-recheck";
import { PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { buildIntakeContextDocumentsFromEvidenceFiles } from "@/lib/intake-context-documents-from-files";
import { describeCoveragePackOverrideBlocker } from "@/lib/wizard-form-create-run-submit";
import { persistSessionRunCoverageAcknowledgement } from "@/lib/persist-run-coverage-acknowledgement";
import { uploadWizardPendingDocumentEvidence } from "@/lib/wizard-pending-evidence-upload";

/** Create + multipart evidence upload can exceed the default soft-fail budget on slow links. */
const FIRST_PILOT_WITH_UPLOAD_TIMEOUT_MS =
  REVIEW_CREATION_PROGRESS_TIMEOUT_MS + PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS;

async function tryBuildIntakeContextDocuments(
  files: readonly File[],
): Promise<CreateArchitectureRunDocumentPayload[]> {
  try {
    return await buildIntakeContextDocumentsFromEvidenceFiles(files);
  } catch {
    return [];
  }
}

export const FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE =
  "Add a review title and either attach architecture evidence or provide enough context in the description.";

export type UseFirstPilotIntakeSubmitOptions = {
  readonly startBlockerInput: FirstPilotStartBlockerInput;
  readonly canStart: boolean;
  readonly resolvedBrief: string;
  readonly evidenceFiles: File[];
  readonly setEvidenceFiles: Dispatch<SetStateAction<File[]>>;
  readonly exampleTemplate: ReviewIntakeExampleTemplate | null;
  readonly buildSubmitBody: (filesToUpload: readonly File[]) => CreateArchitectureRunRequestPayload;
  readonly onRunCreatedNavigate?: (runId: string) => void;
  readonly clearWizardSession: () => void;
  readonly creationProgress: ReviewCreationProgress;
};

export function useFirstPilotIntakeSubmit(options: UseFirstPilotIntakeSubmitOptions) {
  const {
    startBlockerInput,
    canStart,
    resolvedBrief,
    evidenceFiles,
    setEvidenceFiles,
    exampleTemplate,
    buildSubmitBody,
    onRunCreatedNavigate,
    clearWizardSession,
    creationProgress,
  } = options;
  const router = useRouter();
  const [clientValidationMessage, setClientValidationMessage] = useState<string | null>(null);

  const submitRun = async () => {
    const submitBlocker = describeFirstPilotStartBlocker(startBlockerInput);

    if (submitBlocker !== null) {
      setClientValidationMessage(submitBlocker);

      return;
    }

    if (!canStart) {
      setClientValidationMessage(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    const overrideBlocker = describeCoveragePackOverrideBlocker();

    if (overrideBlocker !== null) {
      setClientValidationMessage(overrideBlocker);

      return;
    }

    if (resolvedBrief.length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH) {
      setClientValidationMessage(
        `Brief must not exceed ${ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`,
      );

      return;
    }

    setClientValidationMessage(null);

    const filesToUpload = [...evidenceFiles];
    creationProgress.begin({
      hasTemplate: exampleTemplate !== null,
      timeoutMs: filesToUpload.length > 0 ? FIRST_PILOT_WITH_UPLOAD_TIMEOUT_MS : undefined,
    });

    try {
      const documents = await tryBuildIntakeContextDocuments(filesToUpload);

      const body = {
        ...buildSubmitBody(filesToUpload),
        ...(documents.length > 0 ? { documents } : {}),
      };
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (id === null) {
        creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);

        return;
      }

      try {
        await persistSessionRunCoverageAcknowledgement(id);
      } catch (error) {
        const message =
          isApiRequestError(error) && error.message.trim().length > 0
            ? error.message
            : REVIEW_START_CREATION_FAILED_MESSAGE;
        creationProgress.fail(message);

        return;
      }

      trackReviewPipelineInFlight(id);
      creationProgress.bindOperation(reviewPipelineOperationId(id));

      if (filesToUpload.length > 0) {
        const uploadResult = await uploadWizardPendingDocumentEvidence(id, filesToUpload);

        if (!uploadResult.ok) {
          creationProgress.fail(uploadResult.message);

          return;
        }

        setEvidenceFiles([]);
      }

      recordFirstTenantFunnelEvent("first_run_started");
      creationProgress.markPreparingQuestions();
      creationProgress.markOpeningReview();
      creationProgress.succeed();
      clearWizardSession();

      if (onRunCreatedNavigate !== undefined) {
        onRunCreatedNavigate(id);
        creationProgress.reset();

        return;
      }

      router.push(buildReviewGenerationRedirect(id, "quick-review"));
    } catch (error) {
      if (isArchitectureRequestCreateUnresolvedError(error)) {
        creationProgress.markUnresolved();

        return;
      }

      const message =
        isApiRequestError(error) && error.message.trim().length > 0
          ? error.message
          : REVIEW_START_CREATION_FAILED_MESSAGE;
      creationProgress.fail(message);
    }
  };

  const recheckUnresolvedRun = async () => {
    if (creationProgress.outcome?.kind !== "unresolved") {
      return;
    }

    creationProgress.beginRecheck();

    try {
      const filesToUpload = [...evidenceFiles];
      const documents = await tryBuildIntakeContextDocuments(filesToUpload);
      const body = {
        ...buildSubmitBody(filesToUpload),
        ...(documents.length > 0 ? { documents } : {}),
      };
      const result = await recheckUnresolvedArchitectureReviewCreate(body);

      if (result.status === "still-unresolved") {
        creationProgress.endRecheck();

        return;
      }

      if (result.status === "failed") {
        creationProgress.fail(result.message);
        creationProgress.endRecheck();

        return;
      }

      const id = result.runId;
      creationProgress.markResumed();
      trackReviewPipelineInFlight(id);
      creationProgress.bindOperation(reviewPipelineOperationId(id));

      try {
        await persistSessionRunCoverageAcknowledgement(id);
      } catch (error) {
        const message =
          isApiRequestError(error) && error.message.trim().length > 0
            ? error.message
            : REVIEW_START_CREATION_FAILED_MESSAGE;
        creationProgress.fail(message);
        creationProgress.endRecheck();

        return;
      }

      if (filesToUpload.length > 0) {
        const uploadResult = await uploadWizardPendingDocumentEvidence(id, filesToUpload);

        if (!uploadResult.ok) {
          creationProgress.fail(uploadResult.message);
          creationProgress.endRecheck();

          return;
        }

        setEvidenceFiles([]);
      }

      clearWizardSession();

      if (onRunCreatedNavigate !== undefined) {
        onRunCreatedNavigate(id);
        creationProgress.reset();

        return;
      }

      router.push(buildReviewGenerationRedirect(id, "quick-review"));
    } catch {
      creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
      creationProgress.endRecheck();
    }
  };

  return {
    clientValidationMessage,
    setClientValidationMessage,
    submitRun,
    recheckUnresolvedRun,
  };
}
