import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
  rotateWizardSubmissionSession,
} from "@/lib/wizard-idempotency-key";
import { isArchitectureRequestCreateGatewayTimeout } from "@/lib/api/architecture-request-create-guard";
import { ArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { ApiRequestError, isApiRequestError } from "@/lib/api-request-error";
import { apiGet, apiPostJson } from "./http";

import type {
  CreateArchitectureRunRequestPayload,
  CreateArchitectureRunResponsePayload,
} from "./architecture-runs-create-types";

export function isWizardManagedCreateRun(options?: { readonly idempotencyKey?: string }): boolean {
  return (options?.idempotencyKey?.trim() ?? "").length === 0;
}

export function resolveWizardCreateRunPayload(
  body: CreateArchitectureRunRequestPayload,
): CreateArchitectureRunRequestPayload {
  return {
    ...body,
    requestId: getOrCreateWizardRequestId(),
  };
}

export function isCreateRunIdempotencyBodyConflict(error: unknown): boolean {
  if (!isApiRequestError(error) || error.httpStatus !== 409) {
    return false;
  }

  const detail = (error.problem?.detail ?? error.message).toLowerCase();

  return detail.includes("idempotency-key") && detail.includes("different request");
}

export async function postCreateArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  idempotencyKey: string,
): Promise<CreateArchitectureRunResponsePayload> {
  return apiPostJson<CreateArchitectureRunResponsePayload>("/v1/architecture/request", body, {
    extraHeaders: { "Idempotency-Key": idempotencyKey },
  });
}

export function rethrowCreateRunGatewayTimeout(error: ApiRequestError): never {
  throw new ArchitectureRequestCreateUnresolvedError({
    problem: error.problem,
    correlationId: error.correlationId,
    httpStatus: error.httpStatus,
    retryAfterSeconds: error.retryAfterSeconds,
  });
}

export async function tryRecoverCreateRunFromIdempotencyKey(
  idempotencyKey: string,
): Promise<CreateArchitectureRunResponsePayload | null> {
  try {
    return await apiGet<CreateArchitectureRunResponsePayload>(
      "/v1/architecture/request/idempotency",
      { scopeHeaders: { "Idempotency-Key": idempotencyKey } },
    );
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.httpStatus === 404) {
      return null;
    }

    return null;
  }
}

export async function recoverOrRethrowCreateRunGatewayTimeout(
  error: ApiRequestError,
  idempotencyKey: string,
  wizardManaged: boolean,
): Promise<CreateArchitectureRunResponsePayload | null> {
  const recovered = await tryRecoverCreateRunFromIdempotencyKey(idempotencyKey);

  if (recovered !== null) {
    if (wizardManaged) {
      clearWizardSubmissionSession();
    }

    return recovered;
  }

  rethrowCreateRunGatewayTimeout(error);
}

export { clearWizardSubmissionSession, getOrCreateWizardIdempotencyKey, rotateWizardSubmissionSession };
