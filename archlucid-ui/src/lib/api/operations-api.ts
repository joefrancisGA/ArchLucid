import {
  encodeRequiredPathSegment,
  requireRecord,
  trimRequiredPathSegment,
} from "@/lib/api/api-boundary-normalization";
import { apiGet, apiPostNoContent } from "@/lib/api/http";
import {
  normalizeOperationState,
  type OperationDetail,
  type OperationResultRef,
} from "@/lib/operations/operation-state";

type OperationResponseJson = {
  readonly operationId?: string;
  readonly state?: unknown;
  readonly stepLabel?: string;
  readonly currentStep?: number | null;
  readonly totalSteps?: number | null;
  readonly heartbeatUtc?: string;
  readonly resultRef?: {
    readonly runId?: string | null;
    readonly jobId?: string | null;
    readonly downloadPath?: string | null;
  } | null;
};

export function resolveOperationStepLabel(stepLabel: string | null | undefined): string {
  if (stepLabel === null || stepLabel === undefined) {
    return "Step label was not stored.";
  }

  if (stepLabel.length === 0) {
    return "Step label was stored empty.";
  }

  const trimmed = stepLabel.trim();

  if (trimmed.length === 0) {
    return "Step label was stored empty.";
  }

  return trimmed;
}

function mapResultRef(
  raw: OperationResponseJson["resultRef"],
): OperationResultRef | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  return {
    runId: raw.runId ?? null,
    jobId: raw.jobId ?? null,
    downloadPath: raw.downloadPath ?? null,
  };
}

/** Polls TB-2074 unified operation projection. */
export async function getOperation(operationId: string): Promise<OperationDetail> {
  const trimmedOperationId = trimRequiredPathSegment(operationId, "operationId");
  const encoded = encodeRequiredPathSegment(operationId, "operationId");
  const raw = requireRecord<OperationResponseJson>(
    await apiGet<unknown>(`/v1/operations/${encoded}`),
    "Operation",
  );
  const operationIdFromBody =
    typeof raw.operationId === "string" && raw.operationId.trim().length > 0
      ? raw.operationId.trim()
      : trimmedOperationId;

  return {
    operationId: operationIdFromBody,
    state: normalizeOperationState(raw.state),
    stepLabel: resolveOperationStepLabel(raw.stepLabel),
    currentStep: raw.currentStep ?? null,
    totalSteps: raw.totalSteps ?? null,
    heartbeatUtc: raw.heartbeatUtc ?? new Date().toISOString(),
    resultRef: mapResultRef(raw.resultRef),
  };
}

/**
 * Requests cooperative cancel for a long-running operation (TB-2076 / TB-2225).
 * OpenAPI returns 200 + OperationResponse; body is discarded — poll/patch updates the shell row.
 */
export async function cancelOperation(operationId: string): Promise<void> {
  const encoded = encodeRequiredPathSegment(operationId, "operationId");
  await apiPostNoContent(`/v1/operations/${encoded}/cancel`, {});
}
