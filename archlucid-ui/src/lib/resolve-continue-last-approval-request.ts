import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";

export const APPROVAL_QUEUE_LAST_VIEWED_STORAGE_KEY = "archlucid_approval_queue_continue_last_v1";

const APPROVAL_REQUEST_HREF_PATTERN = /^\/governance\/approval-requests\/([^/]+)/i;

export type ApprovalQueueContinueLastTarget = {
  readonly approvalRequestId: string;
  readonly manifestVersion: string;
  readonly sourceEnvironment: string;
  readonly targetEnvironment: string;
};

function approvalRequestIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";
  const match = APPROVAL_REQUEST_HREF_PATTERN.exec(path);

  if (match === null) {
    return null;
  }

  const approvalRequestId = decodeURIComponent(match[1] ?? "").trim();

  return approvalRequestId.length > 0 ? approvalRequestId : null;
}

function readStoredApprovalRequestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(APPROVAL_QUEUE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    if (stored.length > 0) {
      return stored;
    }

    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const approvalRequestId = approvalRequestIdFromRecentHref(entry.href);

      if (approvalRequestId !== null) {
        return approvalRequestId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function writeApprovalQueueLastViewedRequestId(approvalRequestId: string): void {
  const normalized = approvalRequestId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(APPROVAL_QUEUE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(row: GovernanceApprovalRequest): ApprovalQueueContinueLastTarget {
  return {
    approvalRequestId: row.approvalRequestId,
    manifestVersion: row.manifestVersion,
    sourceEnvironment: row.sourceEnvironment,
    targetEnvironment: row.targetEnvironment,
  };
}

/** Resolves the approval request to pin as Continue last viewed. */
export function resolveContinueLastApprovalRequest(
  approvals: unknown,
): ApprovalQueueContinueLastTarget | null {
  const normalizedApprovals = asNonemptyReadonlyArray<GovernanceApprovalRequest>(approvals);

  if (normalizedApprovals === null) {
    return null;
  }

  const storedId = readStoredApprovalRequestId();

  if (storedId !== null) {
    const storedMatch = normalizedApprovals.find((row) => row.approvalRequestId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = normalizedApprovals
    .slice()
    .sort((left, right) => right.requestedUtc.localeCompare(left.requestedUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
