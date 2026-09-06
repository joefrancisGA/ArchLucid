import type { RunDetail } from "@/types/authority";

export type WithheldFindingReason =
  | "prose-only-emission"
  | "merge-conflict-dropped"
  | "engine-failure-advisory";

export type WithheldFindingRow = {
  readonly withheldFindingId: string;
  readonly reason: WithheldFindingReason;
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
    raw === "engine-failure-advisory"
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
  const title = readString(record.title);

  if (withheldFindingId === null || reason === null || title === null) {
    return null;
  }

  return {
    withheldFindingId,
    reason,
    originEngineType: readString(record.originEngineType) ?? "unknown",
    originAgentType: readString(record.originAgentType),
    title,
    traceTargetId: readString(record.traceTargetId),
    conflictFindingId: readString(record.conflictFindingId),
  };
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

  return "Merge conflict (alternate payload withheld)";
}

export function countEngineFailureAdvisoryWithheldRows(rows: readonly WithheldFindingRow[]): number {
  return rows.filter((row) => row.reason === "engine-failure-advisory").length;
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

export function formatStampWithheldHonestyLine(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return `${count} withheld ${count === 1 ? "item" : "items"} did not enter the sealed record — open Needs attention on Findings.`;
}

export function formatStampCatalogEngineFailureHonestyLine(catalogAdvisoryFailureCount: number): string | null {
  if (catalogAdvisoryFailureCount <= 0) {
    return null;
  }

  return `${catalogAdvisoryFailureCount} catalog ${catalogAdvisoryFailureCount === 1 ? "engine" : "engines"} failed or did not run — open Needs attention on Findings.`;
}
