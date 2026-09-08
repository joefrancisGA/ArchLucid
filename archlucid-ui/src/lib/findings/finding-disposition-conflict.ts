import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api-types";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { readTrimmedString } from "@/lib/api-problem";

export type FindingDispositionConflictDetail = {
  readonly eventId: string;
  readonly findingId: string;
  readonly disposition: FindingDispositionKind;
  readonly reviewerUserId: string;
  readonly occurredAtUtc: string;
  readonly currentDispositionRowVersionBase64: string;
};

export function readFindingDispositionConflictDetail(
  problem: ApiProblemDetails | null,
): FindingDispositionConflictDetail | null {
  if (problem === null) {
    return null;
  }

  const problemRecord = problem as Record<string, unknown>;
  const raw = problemRecord.currentDisposition;

  if (raw === null || typeof raw !== "object") {
    return null;
  }

  const dispositionRecord = raw as Record<string, unknown>;
  const disposition = readTrimmedString(dispositionRecord, "disposition");

  if (disposition === undefined) {
    return null;
  }

  const eventId = readTrimmedString(dispositionRecord, "eventId");
  const findingId = readTrimmedString(dispositionRecord, "findingId");
  const reviewerUserId = readTrimmedString(dispositionRecord, "reviewerUserId") ?? "";
  const occurredAtUtc = readTrimmedString(dispositionRecord, "occurredAtUtc") ?? "";
  const rowVersion = readTrimmedString(dispositionRecord, "currentDispositionRowVersionBase64") ?? "";

  if (eventId === undefined || findingId === undefined) {
    return null;
  }

  return {
    eventId,
    findingId,
    disposition: disposition as FindingDispositionKind,
    reviewerUserId,
    occurredAtUtc,
    currentDispositionRowVersionBase64: rowVersion,
  };
}

export function formatFindingDispositionConflictMessage(
  conflict: FindingDispositionConflictDetail,
): string {
  return `Another operator recorded ${conflict.disposition} at ${conflict.occurredAtUtc}. Reload the current disposition, then amend or record a correction if needed.`;
}
