import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";

export type ResolveImpactPreviewPageStateInput = {
  readonly candidateCount: number;
  readonly listLoading: boolean;
  readonly listFailure: ApiLoadFailureState | null;
  readonly baselineLoading: boolean;
  readonly finalizedBaselineCount: number;
};

function isPermissionFailure(failure: ApiLoadFailureState | null): boolean {
  if (failure === null) {
    return false;
  }

  if (failure.httpStatus === 401 || failure.httpStatus === 403) {
    return true;
  }

  return failure.problem?.status === 401 || failure.problem?.status === 403;
}

/** Resolves which empty or ready surface to show on Impact preview. */
export function resolveImpactPreviewPageState(input: ResolveImpactPreviewPageStateInput): ImpactPreviewPageState {
  if (isPermissionFailure(input.listFailure)) {
    return "permission_denied";
  }

  if (!input.baselineLoading && input.finalizedBaselineCount === 0) {
    return "no_baseline";
  }

  if (!input.listLoading && input.candidateCount === 0) {
    return "no_candidates";
  }

  return "ready";
}
