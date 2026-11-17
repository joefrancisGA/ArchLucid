import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { buildReviewWorkspaceRouteHref } from "@/lib/architecture/review-workspace-route";
import {
  resolveWorkingReviewChildSuffixHref,
  type ResolveWorkingReviewChildSuffixHrefInput,
} from "@/lib/architecture/working-review-child-suffix-href";
import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";

export type ResolveDeskContinuityReviewHrefInput = ResolveWorkingReviewChildSuffixHrefInput;

function resolveDeskContinuityArchitectureId(
  runId: string,
  options?: ResolveDeskContinuityReviewHrefInput,
): string | null {
  const explicit = options?.architectureId?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  return resolveGlobalSearchDeskArchitectureId({
    runId,
    pathname: options?.pathname,
    search: options?.search,
  });
}

/** Open review workspace on nested desk when continuity is known (client or server). */
export function resolveDeskContinuityReviewOpenHref(
  runId: string,
  options?: ResolveDeskContinuityReviewHrefInput,
): string {
  const trimmed = runId.trim();
  const architectureId = resolveDeskContinuityArchitectureId(trimmed, options);

  return resolveArchitectureReviewHref(trimmed, architectureId);
}

export function resolveDeskContinuityProvenanceHref(
  runId: string,
  options?: ResolveDeskContinuityReviewHrefInput,
): string {
  return resolveWorkingReviewChildSuffixHref(runId, "provenance", options);
}

export function resolveDeskContinuityFindingInspectHref(
  runId: string,
  findingId: string,
  options?: ResolveDeskContinuityReviewHrefInput,
): string {
  const trimmedRunId = runId.trim();
  const trimmedFindingId = findingId.trim();

  return buildReviewWorkspaceRouteHref({
    runId: trimmedRunId,
    architectureId: resolveDeskContinuityArchitectureId(trimmedRunId, options),
    findingId: trimmedFindingId,
    findingIdOnPath: true,
  });
}
