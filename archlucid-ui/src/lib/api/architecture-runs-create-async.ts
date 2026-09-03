import { isArchitectureRequestCreateGatewayTimeout } from "@/lib/api/architecture-request-create-guard";
import { ApiRequestError, isApiRequestError } from "@/lib/api-request-error";
import { apiPostAcceptedWithLocation } from "./http";
import { trackInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
} from "@/lib/operations/review-pipeline-in-flight";
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  isCreateRunIdempotencyBodyConflict,
  isWizardManagedCreateRun,
  rethrowCreateRunGatewayTimeout,
  resolveWizardCreateRunPayload,
  rotateWizardSubmissionSession,
  tryRecoverCreateRunFromIdempotencyKey,
} from "./architecture-runs-create-helpers";

import type {
  CreateArchitectureRunAsyncResult,
  CreateArchitectureRunRequestPayload,
} from "./architecture-runs-create-types";

async function postCreateArchitectureRunAsync(
  body: CreateArchitectureRunRequestPayload,
  idempotencyKey: string,
): Promise<CreateArchitectureRunAsyncResult> {
  const accepted = await apiPostAcceptedWithLocation("/v1/architecture/request/async", body, {
    extraHeaders: { "Idempotency-Key": idempotencyKey },
  });
  const operationId =
    parseOperationIdFromLocation(accepted.location) ??
    reviewPipelineOperationId(body.requestId);
  const runId =
    operationId.startsWith("run:") && operationId.length > 4
      ? operationId.slice(4)
      : "";

  if (runId.length === 0) {
    throw new ApiRequestError("Async create accepted without a run handle in Location.", {
      problem: null,
      correlationId: null,
      httpStatus: accepted.status,
    });
  }

  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(runId),
    runId,
    stepLabel: "Queued",
    state: "Pending",
  });

  return { operationId, runId, location: accepted.location };
}

/**
 * Tier C async create: 202 + Location, then register shell in-flight (TB-2077).
 * Prefer this for Real-mode wizard creates; keep sync {@link createArchitectureRun} with `{ sync: true }` for Simulator/CI.
 */
export async function createArchitectureRunAsync(
  body: CreateArchitectureRunRequestPayload,
  options?: { readonly idempotencyKey?: string },
): Promise<CreateArchitectureRunAsyncResult> {
  const wizardManaged = isWizardManagedCreateRun(options);
  let idempotencyKey = options?.idempotencyKey?.trim() || getOrCreateWizardIdempotencyKey();
  let payload = wizardManaged ? resolveWizardCreateRunPayload(body) : body;
  let retriedAfterIdempotencyConflict = false;

  while (true) {
    try {
      const response = await postCreateArchitectureRunAsync(payload, idempotencyKey);

      if (wizardManaged) {
        clearWizardSubmissionSession();
      }

      return response;
    } catch (error: unknown) {
      if (
        wizardManaged &&
        !retriedAfterIdempotencyConflict &&
        isCreateRunIdempotencyBodyConflict(error)
      ) {
        rotateWizardSubmissionSession();
        idempotencyKey = getOrCreateWizardIdempotencyKey();
        payload = resolveWizardCreateRunPayload(body);
        retriedAfterIdempotencyConflict = true;

        continue;
      }

      if (
        isApiRequestError(error) &&
        isArchitectureRequestCreateGatewayTimeout(error.httpStatus, error.problem)
      ) {
        const recovered = await tryRecoverCreateRunFromIdempotencyKey(idempotencyKey);

        if (recovered?.run?.runId) {
          if (wizardManaged) {
            clearWizardSubmissionSession();
          }

          const operationId = reviewPipelineOperationId(recovered.run.runId);

          return {
            operationId,
            runId: recovered.run.runId,
            location: `/v1/operations/${operationId}`,
          };
        }

        rethrowCreateRunGatewayTimeout(error);
      }

      throw error;
    }
  }
}
