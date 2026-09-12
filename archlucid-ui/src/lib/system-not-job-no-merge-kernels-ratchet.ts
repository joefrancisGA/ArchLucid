/** SN-034 — ratchet: synthesis (DraftRequests) and review (Runs) kernels stay separate (ADR 0068). */

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR =
  "docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md" as const;

export const SYSTEM_NOT_JOB_NO_MERGE_KERNELS_OWNER = "SN-034" as const;

/** Close-audit acceptance line — SN-040 cites ADR 0068 via this ratchet. */
export const SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE =
  "DraftRequests and Runs remain two kernels and two SQL tables (ADR 0068); Compare stays run-based (leftRunId/rightRunId)." as const;

export const SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES = {
  synthesis: "dbo.DraftRequests",
  review: "dbo.Runs",
} as const;

export const SYSTEM_NOT_JOB_KERNEL_REPOSITORY_INTERFACES = {
  synthesis: "IDraftRequestRepository",
  review: "IRunRepository",
} as const;

export const SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS = {
  left: "leftRunId",
  right: "rightRunId",
} as const;

/** Draft-shaped compare query params the SN wave must not add. */
export const SYSTEM_NOT_JOB_FORBIDDEN_COMPARE_DRAFT_PARAMS = [
  "draftId",
  "leftDraftId",
  "rightDraftId",
  "DraftRequest",
] as const;

export function isSystemNotJobHonestCompareApiQueryParam(paramName: string): boolean {
  const normalized = paramName.trim();

  return (
    normalized === SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.left ||
    normalized === SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.right
  );
}
