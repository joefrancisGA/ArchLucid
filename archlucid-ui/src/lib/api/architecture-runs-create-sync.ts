import { isArchitectureRequestCreateGatewayTimeout } from "@/lib/api/architecture-request-create-guard";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  isCreateRunIdempotencyBodyConflict,
  isWizardManagedCreateRun,
  postCreateArchitectureRun,
  recoverOrRethrowCreateRunGatewayTimeout,
  resolveWizardCreateRunPayload,
  rotateWizardSubmissionSession,
} from "./architecture-runs-create-helpers";
import { createArchitectureRunAsync } from "./architecture-runs-create-async";

import type {
  CreateArchitectureRunRequestPayload,
  CreateArchitectureRunResponsePayload,
} from "./architecture-runs-create-types";

/** Submits a new architecture run (POST /v1/architecture/request). */
export async function createArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  options?: { readonly idempotencyKey?: string; readonly sync?: boolean },
): Promise<CreateArchitectureRunResponsePayload> {
  const wizardManaged = isWizardManagedCreateRun(options);

  if (options?.sync !== true && wizardManaged) {
    const accepted = await createArchitectureRunAsync(body, options);

    return {
      run: {
        runId: accepted.runId,
        requestId: body.requestId,
        status: "Created",
      },
    } as CreateArchitectureRunResponsePayload;
  }

  let idempotencyKey = options?.idempotencyKey?.trim() || getOrCreateWizardIdempotencyKey();
  let payload = wizardManaged ? resolveWizardCreateRunPayload(body) : body;
  let retriedAfterIdempotencyConflict = false;

  while (true) {
    try {
      const response = await postCreateArchitectureRun(payload, idempotencyKey);

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
        const recovered = await recoverOrRethrowCreateRunGatewayTimeout(
          error,
          idempotencyKey,
          wizardManaged,
        );

        if (recovered !== null) {
          return recovered;
        }
      }

      throw error;
    }
  }
}
