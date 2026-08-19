import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

/**
 * TB-2192 — records that an operator declined the post-commit recurrence proposal for a review.
 *
 * A decline must not create a schedule, so there is nothing server-side to write. Persisting the
 * decline in the browser is what stops the proposal from being re-pushed on every return visit to
 * the same committed review. Scoped by tenant and workspace so a shared browser never leaks one
 * customer's decision into another's.
 */
export const RECURRENCE_PROPOSAL_DECLINE_VERSION = 1 as const;

export type RecurrenceProposalDeclineRecord = {
  readonly v: typeof RECURRENCE_PROPOSAL_DECLINE_VERSION;
  readonly declinedAtUtc: string;
};

function normalizeRunKey(runId: string | null | undefined): string | null {
  const trimmed = runId?.trim().toLowerCase() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.replace(/-/g, "");
}

export function buildRecurrenceProposalDeclineStorageKey(runId: string): string | null {
  const runKey = normalizeRunKey(runId);

  if (runKey === null) {
    return null;
  }

  const scope = readOperatorScopeFromStorage();
  const tenantId = scope?.tenantId?.trim() || "anonymous";
  const workspaceId = scope?.workspaceId?.trim() || "default";

  return `archlucid:recurrence-proposal-declined:v${RECURRENCE_PROPOSAL_DECLINE_VERSION}:${tenantId}:${workspaceId}:${runKey}`;
}

export function readRecurrenceProposalDecline(runId: string): RecurrenceProposalDeclineRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = buildRecurrenceProposalDeclineStorageKey(runId);

  if (key === null) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Partial<RecurrenceProposalDeclineRecord>;

    if (record.v !== RECURRENCE_PROPOSAL_DECLINE_VERSION || typeof record.declinedAtUtc !== "string") {
      return null;
    }

    return { v: RECURRENCE_PROPOSAL_DECLINE_VERSION, declinedAtUtc: record.declinedAtUtc };
  } catch {
    return null;
  }
}

export function hasDeclinedRecurrenceProposal(runId: string): boolean {
  return readRecurrenceProposalDecline(runId) !== null;
}

export function recordRecurrenceProposalDecline(runId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = buildRecurrenceProposalDeclineStorageKey(runId);

  if (key === null) {
    return null;
  }

  const declinedAtUtc = new Date().toISOString();

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ v: RECURRENCE_PROPOSAL_DECLINE_VERSION, declinedAtUtc }),
    );
  } catch {
    // A full or blocked storage quota must not break the decline interaction itself.
    return declinedAtUtc;
  }

  return declinedAtUtc;
}

export function clearRecurrenceProposalDecline(runId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = buildRecurrenceProposalDeclineStorageKey(runId);

  if (key === null) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to recover: an unreadable store already behaves as "not declined".
  }
}
