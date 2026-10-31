import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-disposition-types";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

const KNOWN_DISPOSITION_WIRE_VALUES = new Set([
  "Accepted",
  "Deferred",
  "NeedsEvidence",
  "Remediated",
  "RejectedAsNotApplicable",
]);

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function formatDispositionHistoryDisposition(disposition: string | null | undefined): string {
  if (disposition === null || disposition === undefined) {
    return "Disposition was not stored.";
  }

  if (disposition.length === 0 || disposition.trim().length === 0) {
    return "Disposition was stored empty.";
  }

  const trimmed = disposition.trim();

  if (!KNOWN_DISPOSITION_WIRE_VALUES.has(trimmed)) {
    return "Disposition was not stored.";
  }

  return trimmed;
}

export function formatDispositionHistoryActor(reviewerUserId: string | null | undefined): string {
  if (reviewerUserId === null || reviewerUserId === undefined) {
    return "Reviewer was not stored.";
  }

  const trimmed = reviewerUserId.trim();

  if (trimmed.length === 0) {
    return "Reviewer was stored empty.";
  }

  if (GUID_PATTERN.test(trimmed)) {
    return `Reviewer name was not stored. Reviewer id ${trimmed}.`;
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
  if (occurredAtUtc === null || occurredAtUtc === undefined) {
    return "Recorded time was not stored.";
  }

  if (occurredAtUtc.length === 0) {
    return "Recorded time was stored empty.";
  }

  const trimmed = occurredAtUtc.trim();

  if (trimmed.length === 0) {
    return "Recorded time was stored empty.";
  }

  if (Number.isNaN(parseIsoUtcMs(trimmed))) {
    return "Recorded time was not readable.";
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
    formatDispositionHistoryDisposition(event.disposition),
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
