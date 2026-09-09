import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  architectureIdentityPath,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";

/** Reviews hub inventory filter query — unfinished / needs-attention reviews. */
export const REVIEWS_HUB_NEEDS_ATTENTION_FILTER = "needs-attention" as const;

export const REVIEWS_HUB_UNFINISHED_WORK_HREF =
  `${REVIEWS_LIST_PATH}?filter=${REVIEWS_HUB_NEEDS_ATTENTION_FILTER}` as const;

export type ResolveReviewsHubUnfinishedWorkHrefInput = {
  readonly workingMode: boolean;
  readonly lastOpenArchitectureId?: string | null;
  readonly inFlightParentArchitectureId?: string | null;
  readonly inFlightRunId?: string | null;
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** SY-54 — Working unfinished attention opens the desk or nested job, not hub ?filter=. */
export function resolveReviewsHubUnfinishedWorkHref(
  input: ResolveReviewsHubUnfinishedWorkHrefInput,
): string {
  if (!input.workingMode) {
    return REVIEWS_HUB_UNFINISHED_WORK_HREF;
  }

  const lastOpenArchitectureId = trimmedId(input.lastOpenArchitectureId);

  if (lastOpenArchitectureId !== null) {
    return architectureIdentityPath(lastOpenArchitectureId);
  }

  const inFlightRunId = trimmedId(input.inFlightRunId);
  const inFlightParentArchitectureId = trimmedId(input.inFlightParentArchitectureId);

  if (inFlightRunId !== null && inFlightParentArchitectureId !== null) {
    return resolveArchitectureReviewHref(inFlightRunId, inFlightParentArchitectureId);
  }

  if (inFlightParentArchitectureId !== null) {
    return architectureIdentityPath(inFlightParentArchitectureId);
  }

  return ARCHITECTURES_LIST_PATH;
}
