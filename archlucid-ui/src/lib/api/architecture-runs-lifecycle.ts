import { trackInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
} from "@/lib/operations/review-pipeline-in-flight";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { reviewExecuteMutationBlockedReason } from "@/lib/runs/review-execute-mutation-blocked-reason";
import { reviewAsyncReplayMutationBlockedReason } from "@/lib/runs/review-async-replay-mutation-blocked-reason";
import { reviewFinalizeMutationBlockedReason } from "@/lib/runs/review-finalize-mutation-blocked-reason";
import { reviewPinMutationBlockedReason } from "@/lib/runs/review-pin-mutation-blocked-reason";
import { reviewSelectiveExecuteMutationBlockedReason } from "@/lib/runs/review-selective-execute-mutation-blocked-reason";
import { reviewArchiveMutationBlockedReason } from "@/lib/runs/review-archive-mutation-blocked-reason";
import { architectureRequestLifecycleMutationBlockedReason } from "@/lib/runs/architecture-request-lifecycle-mutation-blocked-reason";
import { internalArchitectureSeedFakeMutationBlockedReason } from "@/lib/runs/internal-architecture-seed-fake-mutation-blocked-reason";

import { rethrowLivelihoodMutate401 } from "@/lib/auth/livelihood-mutation-api-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  encodeRequiredPathSegment,
  trimOptionalText,
  trimRequiredPathSegment,
  trimStringList,
} from "./api-boundary-normalization";
import {
  apiPatchJson,
  apiPostAcceptedWithLocation,
  apiPostJson,
  apiPostNoContent,
  apiDelete,
} from "./http";

function reviewPath(runId: string): string {
  return `/v1/architecture/review/${encodeRequiredPathSegment(runId, "runId")}`;
}

function architectureRequestPath(requestId: string): string {
  return `/v1/architecture/request/${encodeRequiredPathSegment(requestId, "requestId")}`;
}

/** Pins or unpins a run (PATCH /v1/architecture/review/{runId}/pin). Omit `isPinned` to toggle. */
export async function pinArchitectureRun(
  runId: string,
  body: { readonly isPinned?: boolean } = {},
): Promise<{ runId: string; isPinned: boolean }> {
  const path = `${reviewPath(runId)}/pin`;

  try {
    return await apiPatchJson<{ runId: string; isPinned: boolean }>(path, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewPinMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Finalizes agent results into a Finalized review record (POST /v1/architecture/review/{runId}/finalize). */
export async function commitArchitectureRun(
  runId: string,
  options?: {
    readonly notifySponsor?: boolean;
    readonly acknowledgedAssumptionIds?: readonly string[];
  },
  requestOptions?: { readonly idempotencyKey?: string },
): Promise<unknown> {
  const idempotencyKey = requestOptions?.idempotencyKey?.trim() ?? "";
  const extraHeaders =
    idempotencyKey.length > 0 ? { "Idempotency-Key": idempotencyKey } : undefined;
  const path = `${reviewPath(runId)}/finalize`;

  try {
    return await apiPostJson<unknown>(
      path,
      {
        notifySponsor: options?.notifySponsor === true,
        // Omitted stays omitted, so the server can tell "none sent" from "an empty list".
        acknowledgedAssumptionIds:
          options?.acknowledgedAssumptionIds !== undefined
            ? trimStringList(options.acknowledgedAssumptionIds)
            : undefined,
      },
      { extraHeaders },
    );
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);

    const failure = toApiLoadFailure(error);
    const blockedReason = reviewFinalizeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Runs agent pipeline for an architecture review (POST /v1/architecture/review/{runId}/execute). */
export async function executeArchitectureRun(runId: string): Promise<unknown> {
  const path = `${reviewPath(runId)}/execute`;

  try {
    return await apiPostJson<unknown>(path, {});
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewExecuteMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  try {
    const accepted = await apiPostAcceptedWithLocation(`${reviewPath(normalizedRunId)}/execute/async`, {});
    const operationId =
      parseOperationIdFromLocation(accepted.location) ?? reviewPipelineOperationId(normalizedRunId);

    trackInFlightOperation({
      operationId,
      title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
      href: reviewPipelineDetailHref(normalizedRunId),
      runId: normalizedRunId,
      stepLabel: "Queued",
      state: "Pending",
    });

    return { operationId, location: accepted.location };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewExecuteMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export type ReplayArchitectureRunAsyncResult = {
  readonly operationId: string;
  readonly location: string | null;
};

/** Tier C async replay (TB-2075): 202 + Location for long-running replay work. */
export async function replayArchitectureRunAsync(
  runId: string,
  body: {
    readonly executionMode?: string;
    readonly commitReplay?: boolean;
    readonly manifestVersionOverride?: string | null;
  } = {},
): Promise<ReplayArchitectureRunAsyncResult> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  try {
    const accepted = await apiPostAcceptedWithLocation(
      `${reviewPath(normalizedRunId)}/replay/async`,
      {
        executionMode: trimOptionalText(body.executionMode),
        commitReplay: body.commitReplay,
        manifestVersionOverride: trimOptionalText(body.manifestVersionOverride),
      },
    );
    const operationId =
      parseOperationIdFromLocation(accepted.location) ?? reviewPipelineOperationId(normalizedRunId);

    trackInFlightOperation({
      operationId,
      title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
      href: reviewPipelineDetailHref(normalizedRunId),
      runId: normalizedRunId,
      stepLabel: "Replay queued",
      state: "Pending",
    });

    return { operationId, location: accepted.location };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewAsyncReplayMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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
  const path = `${reviewPath(runId)}/execute/selective`;

  try {
    return await apiPostJson<unknown>(path, {
      agentTypes: trimStringList(body.agentTypes),
      taskIds: trimStringList(body.taskIds),
      includeDependents: body.includeDependents !== false,
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewSelectiveExecuteMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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
  // Reject a blank id here, before the shell registers an in-flight row for a run that does not exist.
  const trimmedRunId = trimRequiredPathSegment(runId, "runId");
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
  const encodedRunId = encodeRequiredPathSegment(runId, "runId");

  try {
    return await apiPostJson<{ resultCount?: number }>(
      `/v1/internal/architecture/runs/${encodedRunId}/seed-fake-results`,
      {},
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = internalArchitectureSeedFakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Restores a soft-archived architecture request (POST /v1/architecture/request/{requestId}/restore). */
export async function restoreArchitectureRequest(requestId: string): Promise<void> {
  const path = `${architectureRequestPath(requestId)}/restore`;

  try {
    await apiPostNoContent(path, {});
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureRequestLifecycleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Clones an architecture request as a new template (POST /v1/architecture/request/{requestId}/clone). */
export async function cloneArchitectureRequest(requestId: string): Promise<unknown> {
  const path = `${architectureRequestPath(requestId)}/clone`;

  try {
    return await apiPostJson<unknown>(path, {});
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureRequestLifecycleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Archives an architecture request (PATCH /v1/architecture/request/{requestId}/archive). */
export async function archiveArchitectureRequest(requestId: string): Promise<void> {
  const path = `${architectureRequestPath(requestId)}/archive`;

  try {
    await apiPatchJson<unknown>(path, {});
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewArchiveMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Soft-deletes an architecture request (DELETE /v1/architecture/request/{requestId}). */
export async function deleteArchitectureRequest(requestId: string): Promise<void> {
  const path = architectureRequestPath(requestId);

  try {
    await apiDelete(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureRequestLifecycleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
