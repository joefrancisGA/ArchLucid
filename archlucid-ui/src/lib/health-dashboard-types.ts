/**
 * JSON shapes from `GET /health/ready` (summary; includes checks tagged Ready, e.g. `data_archival`),
 * anonymous `GET /health` (database probe only), and `GET /health/diagnostics` (detailed) — see
 * `ArchLucid.Host.Core/Health/DetailedHealthCheckResponseWriter.cs` and
 * `ArchLucid.Api/Startup/PipelineExtensions.cs`.
 */
export type { HealthReadyResponse } from "./health-dashboard-ready";

export {
  findHealthReadyEntryByName,
  isHealthEntryStatusDegraded,
  isHealthEntryStatusUnhealthy,
  isAzureServiceBusHealthUnhealthy,
  isDataArchivalHealthDegraded,
} from "./health-dashboard-ready";

export type {
  HealthDetailedEntry,
  HealthDetailedResponse,
  CircuitGateRow,
  OperatorTaskSuccessRatesResponse,
} from "./health-dashboard-detailed";

export { parseCircuitGatesFromHealthEntry, findCircuitBreakersEntry } from "./health-dashboard-detailed";

export type { VersionInfoResponse } from "./health-dashboard-version";
