/**
 * JSON shapes from `GET /health/ready` (summary; includes checks tagged Ready, e.g. `data_archival`),
 * anonymous `GET /health` (database probe only), and `GET /health/diagnostics` (detailed) — see
 * `ArchLucid.Host.Core/Health/DetailedHealthCheckResponseWriter.cs` and
 * `ArchLucid.Api/Startup/PipelineExtensions.cs`.
 */
export type HealthReadyResponse = {
  status: string;
  entries: ReadonlyArray<{
    name: string;
    status: string;
    /** Present only if the host writer adds timing to the readiness payload; default summary omits it. */
    durationMs?: number;
  }>;
};

export type HealthDetailedEntry = {
  name: string;
  status: string;
  durationMs?: number;
  description?: string;
  error?: string | null;
  data?: Record<string, unknown> | null;
};

export type HealthDetailedResponse = {
  status: string;
  totalDurationMs?: number;
  version?: string;
  commitSha?: string;
  entries: ReadonlyArray<HealthDetailedEntry>;
};

export type VersionInfoResponse = {
  application?: string;
  informationalVersion?: string;
  commitSha?: string | null;
  environment?: string;
  processUptimeSeconds?: number;
};

export type CircuitGateRow = {
  name: string;
  state: string;
  breakDurationSeconds?: number;
  consecutiveFailures?: number;
  failureThreshold?: number;
  lastStateChangeUtc?: string;
};

export type OperatorTaskSuccessRatesResponse = {
  windowNote: string;
  firstRunCommittedTotal: number;
  firstSessionCompletedTotal: number;
  firstRunCommittedPerSessionRatio: number;
};

export function parseCircuitGatesFromHealthEntry(
  data: Record<string, unknown> | null | undefined,
): CircuitGateRow[] {
  if (data === null || data === undefined) {
    return [];
  }
  const gates = data.gates;
  if (!Array.isArray(gates)) {
    return [];
  }
  const out: CircuitGateRow[] = [];
  for (const g of gates) {
    if (g === null || typeof g !== "object") {
      continue;
    }
    const row = g as Record<string, unknown>;
    const name = String(row.name ?? "—");
    const state = String(row.state ?? "—");
    const breakDurationSeconds =
      typeof row.breakDurationSeconds === "number" ? row.breakDurationSeconds : undefined;
    out.push({
      name,
      state,
      breakDurationSeconds,
      consecutiveFailures: typeof row.consecutiveFailures === "number" ? row.consecutiveFailures : undefined,
      failureThreshold: typeof row.failureThreshold === "number" ? row.failureThreshold : undefined,
      lastStateChangeUtc: typeof row.lastStateChangeUtc === "string" ? row.lastStateChangeUtc : undefined,
    });
  }
  return out;
}

export function findCircuitBreakersEntry(entries: ReadonlyArray<HealthDetailedEntry>): HealthDetailedEntry | null {
  for (const e of entries) {
    if (e.name === "circuit_breakers") {
      return e;
    }
  }
  return null;
}

/** Resolves a single named entry from the readiness summary (`GET /health/ready`). */
export function findHealthReadyEntryByName(
  entries: HealthReadyResponse["entries"],
  name: string,
): HealthReadyResponse["entries"][number] | null {
  for (const e of entries) {
    if (e.name === name) {
      return e;
    }
  }

  return null;
}

export function isHealthEntryStatusDegraded(status: string | undefined | null): boolean {
  return status?.trim().toLowerCase() === "degraded";
}

/** True when the worker `data_archival` readiness check reports Degraded (absent when archival is off or not on a worker host). */
export function isDataArchivalHealthDegraded(entries: HealthReadyResponse["entries"]): boolean {
  const entry = findHealthReadyEntryByName(entries, "data_archival");

  return entry !== null && isHealthEntryStatusDegraded(entry.status);
}
