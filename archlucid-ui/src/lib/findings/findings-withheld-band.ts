import type { RunDetail } from "@/types/authority";

export type WithheldFindingReason =
  | "prose-only-emission"
  | "merge-conflict-dropped"
  | "engine-failure-advisory"
  | "compliance-tag-from-prose";

export type WithheldFindingRow = {
  readonly withheldFindingId: string;
  readonly reason: WithheldFindingReason;
  readonly reasonDisplay: string;
  readonly originEngineType: string;
  readonly originAgentType: string | null;
  readonly title: string;
  readonly traceTargetId: string | null;
  readonly conflictFindingId: string | null;
};

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function parseWithheldReason(value: unknown): WithheldFindingReason | null {
  const raw = readString(value);

  if (
    raw === "prose-only-emission" ||
    raw === "merge-conflict-dropped" ||
    raw === "engine-failure-advisory" ||
    raw === "compliance-tag-from-prose"
  ) {
    return raw;
  }

  return null;
}

function parseWithheldRow(value: unknown): WithheldFindingRow | null {
  const record = readRecord(value);

  if (record === null) {
    return null;
  }

  const withheldFindingId = readString(record.withheldFindingId);
  const reason = parseWithheldReason(record.reason);
  const title = readString(record.title) ?? "Finding title was not stored.";

  if (withheldFindingId === null) {
    return null;
  }

  const resolvedReason = reason ?? "merge-conflict-dropped";

  return {
    withheldFindingId,
    reason: resolvedReason,
    reasonDisplay:
      reason !== null ? formatWithheldFindingReasonLabel(reason) : "Withheld reason was not stored.",
    originEngineType: readString(record.originEngineType) ?? "Origin engine was not stored.",
    originAgentType: readString(record.originAgentType),
    title,
    traceTargetId: readString(record.traceTargetId),
    conflictFindingId: readString(record.conflictFindingId),
  };
}

export const FINDINGS_WITHHELD_LIST_NOT_STORED_LABEL =
  "Withheld findings list was not stored." as const;

/** When findings snapshot exists but withheldFindings was omitted on the wire. */
export function describeFindingsWithheldListLoadState(detail: RunDetail): string | null {
  const snapshot = readRecord((detail as Record<string, unknown>).findingsSnapshot);

  if (snapshot === null) {
    return null;
  }

  const withheldRaw = snapshot.withheldFindings;

  if (withheldRaw === undefined) {
    return FINDINGS_WITHHELD_LIST_NOT_STORED_LABEL;
  }

  if (!Array.isArray(withheldRaw)) {
    return FINDINGS_WITHHELD_LIST_NOT_STORED_LABEL;
  }

  return null;
}

/** Parses DR-02 withheld rows from hydrated run detail `findingsSnapshot`. */
export function resolveFindingsWithheldRows(detail: RunDetail): readonly WithheldFindingRow[] {
  const snapshot = readRecord((detail as Record<string, unknown>).findingsSnapshot);

  if (snapshot === null) {
    return [];
  }

  const withheldRaw = snapshot.withheldFindings;

  if (!Array.isArray(withheldRaw)) {
    return [];
  }

  const rows: WithheldFindingRow[] = [];

  for (const item of withheldRaw) {
    const parsed = parseWithheldRow(item);

    if (parsed !== null) {
      rows.push(parsed);
    }
  }

  return rows;
}

export function formatWithheldFindingReasonLabel(reason: WithheldFindingReason): string {
  if (reason === "prose-only-emission") {
    return "Prose-only emission (no typed evidence)";
  }

  if (reason === "engine-failure-advisory") {
    return "Engine did not run (advisory failure)";
  }

  if (reason === "compliance-tag-from-prose") {
    return "Compliance tag from prose (quarantined)";
  }

  return "Merge conflict (alternate payload withheld)";
}

export function countEngineFailureAdvisoryWithheldRows(rows: readonly WithheldFindingRow[]): number {
  return rows.filter((row) => row.reason === "engine-failure-advisory").length;
}

export function formatWithheldFindingOpenLinkLabel(row: WithheldFindingRow): string {
  if (row.traceTargetId === null && row.conflictFindingId === null) {
    return "Open findings. A trace target was not stored.";
  }

  return "Open trace or conflict resolution";
}

export function buildWithheldFindingDeepLink(runId: string, row: WithheldFindingRow): string {
  if (row.reason === "engine-failure-advisory") {
    return `/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=findings`;
  }

  if (row.conflictFindingId !== null) {
    return `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(row.conflictFindingId)}`;
  }

  if (row.traceTargetId !== null) {
    return `/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=activity#agent-forensics`;
  }

  return `/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=findings`;
}

export function formatStampWithheldHonestyLine(count: number | null | undefined): string | null {
  if (count === null || count === undefined) {
    return "Withheld finding count was not stored.";
  }

  if (count <= 0) {
    return null;
  }

  return `${count} withheld ${count === 1 ? "item" : "items"} did not enter the sealed record — open Needs attention on Findings.`;
}

export function formatStampCatalogEngineFailureHonestyLine(
  catalogAdvisoryFailureCount: number | null | undefined,
): string | null {
  if (catalogAdvisoryFailureCount === null || catalogAdvisoryFailureCount === undefined) {
    return "Catalog engine failure count was not stored.";
  }

  if (catalogAdvisoryFailureCount <= 0) {
    return null;
  }

  return `${catalogAdvisoryFailureCount} catalog ${catalogAdvisoryFailureCount === 1 ? "engine" : "engines"} failed or did not run — open Needs attention on Findings.`;
}
