import type { components } from "@/lib/openapi-schemas";
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
  rotateWizardSubmissionSession,
} from "@/lib/wizard-idempotency-key";
import {
  isArchitectureRequestCreateGatewayTimeout,
} from "@/lib/api/architecture-request-create-guard";
import { ArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { ApiRequestError, isApiRequestError } from "@/lib/api-request-error";
import { trackInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
} from "@/lib/operations/review-pipeline-in-flight";
import {
  apiPatchJson,
  apiPostAcceptedWithLocation,
  apiPostJson,
  apiPostNoContent,
} from "./http";

/** Attached context document (camelCase JSON — matches API `ContextDocumentRequest`). */
export type CreateArchitectureRunDocumentPayload = {
  name: string;
  contentType: string;
  content: string;
};

/** IaC / declaration blob (camelCase JSON — matches API `InfrastructureDeclarationRequest`). */
export type CreateArchitectureRunInfrastructureDeclarationPayload = {
  name: string;
  format: string;
  content: string;
};

/** Body shape for POST /v1/architecture/request (operator wizard + full `ArchitectureRequest` surface). */
export type CreateArchitectureRunRequestPayload = {
  requestId: string;
  description: string;
  systemName: string;
  environment: string;
  cloudProvider: "None" | "Azure" | "Aws" | "Gcp";
  constraints: string[];
  requiredCapabilities: string[];
  assumptions: string[];
  priorManifestVersion?: string;
  inlineRequirements?: string[];
  documents?: CreateArchitectureRunDocumentPayload[];
  policyReferences?: string[];
  topologyHints?: string[];
  securityBaselineHints?: string[];
  infrastructureDeclarations?: CreateArchitectureRunInfrastructureDeclarationPayload[];
  requestSource?: "wizard" | "cli";
  wizardPresetUsed?: string;
  modelExecutionProfileOverride?: "Economy" | "Balanced" | "HighAssurance";
  modelAliasOverride?: string;
  intakeQuestionAnswers?: Record<string, string>;
  intakeTransparencyTrail?: {
    asserted: readonly { key: string; value: string }[];
    inferred: readonly { key: string; value: string; confidence: number }[];
    skipped: readonly { questionKey: string; tier: "Must" | "Should" }[];
  };
};

/** Response envelope for POST /v1/architecture/request. */
export type CreateArchitectureRunResponsePayload =
  components["schemas"]["CreateArchitectureRunResponse"];

function isWizardManagedCreateRun(options?: { readonly idempotencyKey?: string }): boolean {
  return (options?.idempotencyKey?.trim() ?? "").length === 0;
}

function resolveWizardCreateRunPayload(
  body: CreateArchitectureRunRequestPayload,
): CreateArchitectureRunRequestPayload {
  return {
    ...body,
    requestId: getOrCreateWizardRequestId(),
  };
}

function isCreateRunIdempotencyBodyConflict(error: unknown): boolean {
  if (!isApiRequestError(error) || error.httpStatus !== 409) {
    return false;
  }

  const detail = (error.problem?.detail ?? error.message).toLowerCase();

  return detail.includes("idempotency-key") && detail.includes("different request");
}

async function postCreateArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  idempotencyKey: string,
): Promise<CreateArchitectureRunResponsePayload> {
  return apiPostJson<CreateArchitectureRunResponsePayload>("/v1/architecture/request", body, {
    extraHeaders: { "Idempotency-Key": idempotencyKey },
  });
}

function rethrowCreateRunGatewayTimeout(error: ApiRequestError): never {
  throw new ArchitectureRequestCreateUnresolvedError({
    problem: error.problem,
    correlationId: error.correlationId,
    httpStatus: error.httpStatus,
    retryAfterSeconds: error.retryAfterSeconds,
  });
}

export type CreateArchitectureRunAsyncResult = {
  readonly operationId: string;
  readonly runId: string;
  readonly location: string | null;
};

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
        rethrowCreateRunGatewayTimeout(error);
      }

      throw error;
    }
  }
}

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
        rethrowCreateRunGatewayTimeout(error);
      }

      throw error;
    }
  }
}

/** Pins or unpins a run (PATCH /v1/architecture/review/{runId}/pin). Omit `isPinned` to toggle. */
export async function pinArchitectureRun(
  runId: string,
  body: { readonly isPinned?: boolean } = {},
): Promise<{ runId: string; isPinned: boolean }> {
  return apiPatchJson<{ runId: string; isPinned: boolean }>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/pin`,
    body,
  );
}

/** Finalizes agent results into a Finalized review record (POST /v1/architecture/review/{runId}/finalize). */
export async function commitArchitectureRun(
  runId: string,
  options?: {
    readonly notifySponsor?: boolean;
    readonly acknowledgedAssumptionIds?: readonly string[];
  },
): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/finalize`, {
    notifySponsor: options?.notifySponsor === true,
    acknowledgedAssumptionIds: options?.acknowledgedAssumptionIds ?? undefined,
  });
}

/** Runs agent pipeline for an architecture review (POST /v1/architecture/review/{runId}/execute). */
export async function executeArchitectureRun(runId: string): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/execute`, {});
}

export type ExecuteArchitectureRunAsyncResult = {
  readonly operationId: string;
  readonly location: string | null;
};

/**
 * Tier C async execute (TB-2075): 202 + Location, then register shell in-flight (TB-2077).
 * Prefer this for Real-mode work behind proxy/edge timeouts; keep sync {@link executeArchitectureRun} for Simulator/CI.
 */
export async function executeArchitectureRunAsync(
  runId: string,
): Promise<ExecuteArchitectureRunAsyncResult> {
  const accepted = await apiPostAcceptedWithLocation(
    `/v1/architecture/review/${encodeURIComponent(runId)}/execute/async`,
    {},
  );
  const operationId =
    parseOperationIdFromLocation(accepted.location) ?? reviewPipelineOperationId(runId);

  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(runId),
    runId,
    stepLabel: "Queued",
    state: "Pending",
  });

  return { operationId, location: accepted.location };
}

/** TB-938: re-execute selected agents only (POST /v1/architecture/review/{runId}/execute/selective). */
export async function executeArchitectureRunSelective(
  runId: string,
  body: {
    readonly agentTypes?: readonly string[];
    readonly taskIds?: readonly string[];
    readonly includeDependents?: boolean;
  },
): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/execute/selective`, {
    agentTypes: body.agentTypes ?? [],
    taskIds: body.taskIds ?? [],
    includeDependents: body.includeDependents !== false,
  });
}

/** Seeds deterministic fake agent results for a run (POST /v1/internal/architecture/runs/{runId}/seed-fake-results; operator + ExecuteAuthority). */
export async function seedFakeArchitectureRunResults(runId: string): Promise<{ resultCount?: number }> {
  return apiPostJson<{ resultCount?: number }>(
    `/v1/internal/architecture/runs/${encodeURIComponent(runId)}/seed-fake-results`,
    {},
  );
}

/** Restores a soft-archived architecture request (POST /v1/architecture/request/{requestId}/restore). */
export async function restoreArchitectureRequest(requestId: string): Promise<void> {
  return apiPostNoContent(`/v1/architecture/request/${encodeURIComponent(requestId)}/restore`, {});
}
