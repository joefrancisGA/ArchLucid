export const APPROVAL_BLOCKER_STORED_LABEL_PREFIX = "Approval is blocked by" as const;

export const APPROVAL_BLOCKER_SEVERITY_FIRST_INTRO =
  "Approval is blocked. The finding below is the first sorted open finding — not a stored approval blocker:" as const;

export function resolveApprovalBlockerPresentation(input: {
  readonly approvalBlocked: boolean;
  readonly blockingFindingId: string | null | undefined;
  readonly blockingFindingTitle: string | null | undefined;
  readonly usesStoredApprovalBlocker?: boolean;
}): {
  readonly show: boolean;
  readonly findingId: string;
  readonly findingTitle: string;
  readonly usesStoredApprovalBlocker: boolean;
} | null {
  if (input.approvalBlocked !== true) {
    return null;
  }

  const findingId = typeof input.blockingFindingId === "string" ? input.blockingFindingId.trim() : "";
  const findingTitle =
    typeof input.blockingFindingTitle === "string" ? input.blockingFindingTitle.trim() : "";
  const usesStoredApprovalBlocker = input.usesStoredApprovalBlocker === true;

  if (findingId.length === 0 || findingTitle.length === 0) {
    return null;
  }

  return { show: true, findingId, findingTitle, usesStoredApprovalBlocker };
}
