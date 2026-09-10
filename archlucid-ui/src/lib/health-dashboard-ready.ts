/**
 * JSON shapes from `GET /health/ready` (summary; includes checks tagged Ready, e.g. `data_archival`).
 * See `ArchLucid.Host.Core/Health/DetailedHealthCheckResponseWriter.cs` and
 * `ArchLucid.Api/Startup/PipelineExtensions.cs`.
 */
export type HealthReadyResponse = {
  status: string;
  /** Host `AgentExecution:Mode` when the readiness writer includes it (`DetailedHealthCheckResponseWriter`). */
  agentExecutionMode?: string;
  /** Host `ArchLucid:Governance:PreCommitGateEnabled` when the readiness writer includes it (DR-04). */
  preCommitGateEnabled?: boolean;
  /** Host `ArchLucid:AgentOutput:QualityGate:Mode` when the readiness writer includes it (DR-05). */
  agentOutputQualityGateMode?: string;
  entries: ReadonlyArray<{
    name: string;
    status: string;
    /** Present only if the host writer adds timing to the readiness payload; default summary omits it. */
    durationMs?: number;
  }>;
};

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

export function isHealthEntryStatusUnhealthy(status: string | undefined | null): boolean {
  const normalized = status?.trim().toLowerCase() ?? "";

  return normalized === "unhealthy" || normalized === "degraded";
}

/** True when the `azure_service_bus` readiness check reports Unhealthy or Degraded. */
export function isAzureServiceBusHealthUnhealthy(entries: HealthReadyResponse["entries"]): boolean {
  const entry = findHealthReadyEntryByName(entries, "azure_service_bus");

  return entry !== null && isHealthEntryStatusUnhealthy(entry.status);
}

/** True when the worker `data_archival` readiness check reports Degraded (absent when archival is off or not on a worker host). */
export function isDataArchivalHealthDegraded(entries: HealthReadyResponse["entries"]): boolean {
  const entry = findHealthReadyEntryByName(entries, "data_archival");

  return entry !== null && isHealthEntryStatusDegraded(entry.status);
}
