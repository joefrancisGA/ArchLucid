import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-disposition-types";

export function formatDispositionHistoryActor(reviewerUserId: string | null | undefined): string {
  const trimmed = reviewerUserId?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Reviewer was not stored.";
  }

  return trimmed;
}

export function formatDispositionHistoryRationale(rationale: string | null | undefined): string {
  if (rationale === null || rationale === undefined) {
    return "Rationale was not stored.";
  }

  if (rationale.length === 0 || rationale.trim().length === 0) {
    return "Rationale was stored empty.";
  }

  return rationale.trim();
}

export function formatDispositionHistoryRecordedTime(occurredAtUtc: string | null | undefined): string {
  const trimmed = occurredAtUtc?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Recorded time was not stored.";
  }

  return trimmed;
}

export function formatDispositionHistoryRevisitDue(revisitDueUtc: string | null | undefined): string {
  if (revisitDueUtc === null || revisitDueUtc === undefined) {
    return "Revisit due was not stored.";
  }

  if (revisitDueUtc.trim().length === 0) {
    return "Revisit due was stored empty.";
  }

  return revisitDueUtc.trim();
}

export function formatFindingDispositionHistoryLine(event: FindingDispositionEvent): string {
  const parts = [
    event.disposition,
    formatDispositionHistoryActor(event.reviewerUserId),
    formatDispositionHistoryRecordedTime(event.occurredAtUtc),
    formatDispositionHistoryRationale(event.rationale),
  ];

  if (event.disposition === "Deferred") {
    parts.push(formatDispositionHistoryRevisitDue(event.revisitDueUtc));
  }

  return parts.join(" · ");
}

export function formatActiveWaiverRationale(rationale: string | null | undefined): string {
  if (rationale === null || rationale === undefined) {
    return "Waiver rationale was not stored.";
  }

  if (rationale.trim().length === 0) {
    return "Waiver rationale was stored empty.";
  }

  return rationale.trim();
}

export function formatActiveWaiverEvidenceRef(evidenceRef: string | null | undefined): string {
  if (evidenceRef === null || evidenceRef === undefined) {
    return "Waiver evidence reference was not stored.";
  }

  if (evidenceRef.trim().length === 0) {
    return "Waiver evidence reference was stored empty.";
  }

  return evidenceRef.trim();
}
