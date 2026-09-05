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
    { suppressErrorToast: true },
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

/**
 * Selective re-execute with shell in-flight registration (TB-2077) so the review page is not the only progress surface.
 */
export async function executeArchitectureRunSelectiveInFlight(
  runId: string,
  body: {
    readonly agentTypes?: readonly string[];
    readonly taskIds?: readonly string[];
    readonly includeDependents?: boolean;
  },
): Promise<unknown> {
  const trimmedRunId = runId.trim();
  const operationId = reviewPipelineOperationId(trimmedRunId);

  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(trimmedRunId),
    runId: trimmedRunId,
    stepLabel: "Selective retry",
    state: "Running",
  });

  return executeArchitectureRunSelective(trimmedRunId, body);
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
