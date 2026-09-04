import {
  removeInFlightOperation,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { resolveOperationDetailHref } from "@/lib/operations/operation-location";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo/eligibility";

export const REVIEW_PIPELINE_IN_FLIGHT_TITLE = "Architecture review analysis";

/**
 * `run:{runId}` is a first-class operation handle server-side (`OperationIdCodec.RunPrefix`), so
 * `GET /v1/operations/run:{runId}` projects the review's own status. That is why the create path can
 * register without a 202 `Location`: there is no separate operation record to wait for.
 */
export function reviewPipelineOperationId(runId: string): string {
  return `run:${runId.trim()}`;
}

export function reviewPipelineDetailHref(runId: string): string {
  return resolveOperationDetailHref("/architecture/reviews", runId);
}

/**
 * Registers a just-created review with the shell in-flight tracker (TB-2077) so leaving the wizard
 * does not lose the only indication that analysis is running. Create starts the pipeline server-side
 * — the UI never posts execute on this path — so the row is accurate from the moment create returns.
 *
 * Returns the tracked operation id, or `null` when nothing was registered.
 */
export function trackReviewPipelineInFlight(runId: string | null | undefined): string | null {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  // Demo, frictionless-trial, and presenter-offline shells serve curated payloads with no live
  // operations endpoint, so a tracked row would poll a 404 and never reach a terminal state.
  if (isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const operationId = reviewPipelineOperationId(trimmed);

  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(trimmed),
    runId: trimmed,
    stepLabel: "Queued",
    state: "Pending",
  });

  return operationId;
}

/**
 * Clears a prior terminal pipeline row and registers a fresh in-flight attempt.
 * Call synchronously when the operator starts a re-run so stale failure copy cannot flash.
 */
export function restartReviewPipelineInFlight(
  runId: string,
  startedAtMs: number = Date.now(),
): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const operationId = reviewPipelineOperationId(trimmed);

  removeInFlightOperation(operationId);
  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(trimmed),
    runId: trimmed,
    stepLabel: "Queued",
    state: "Pending",
    startedAtMs,
    heartbeatUtc: null,
  });

  return operationId;
}
