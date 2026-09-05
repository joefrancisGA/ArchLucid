import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import { getOperation } from "@/lib/api/operations-api";
import {
  getInFlightOperations,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
} from "@/lib/operations/review-pipeline-in-flight";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export type RehydrateInFlightOperationsScope = {
  readonly tenantId?: string;
  readonly workspaceId?: string;
  readonly projectId?: string;
  readonly architectureId?: string;
};

function reviewRowIsCandidate(review: ArchitectureIdentityChildReviewSummary): boolean {
  return review.runId.trim().length > 0;
}

/**
 * Rebuilds in-flight review rows from server operation projections for the current scope (DA-10).
 * Does not resurrect another tenant's operations — callers must pass scope-matched architecture ids.
 */
export async function rehydrateInFlightOperationsFromArchitecture(
  scope: RehydrateInFlightOperationsScope,
): Promise<number> {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return 0;
  }

  const architectureId = scope.architectureId?.trim() ?? "";

  if (architectureId.length === 0) {
    return 0;
  }

  const identity = await getArchitectureIdentity(architectureId);
  const knownOperationIds = new Set(getInFlightOperations().map((row) => row.operationId));
  let restored = 0;

  for (const review of identity.reviews) {
    if (!reviewRowIsCandidate(review)) {
      continue;
    }

    const runId = review.runId.trim();
    const operationId = reviewPipelineOperationId(runId);

    if (knownOperationIds.has(operationId)) {
      continue;
    }

    try {
      const detail = await getOperation(operationId);

      if (isTerminalOperationState(detail.state)) {
        continue;
      }

      trackInFlightOperation({
        operationId,
        title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
        href: reviewPipelineDetailHref(runId),
        runId,
        architectureId,
        stepLabel: detail.stepLabel,
        state: detail.state,
        heartbeatUtc: detail.heartbeatUtc,
      });
      knownOperationIds.add(operationId);
      restored += 1;
    } catch {
      // Skip rows the server no longer projects for this scope.
    }
  }

  return restored;
}
