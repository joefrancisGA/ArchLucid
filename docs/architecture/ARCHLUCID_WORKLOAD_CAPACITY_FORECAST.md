# ArchLucid workload capacity scenarios (CAP-01 through CAP-06 foundation)

Read-only application utilities in `ArchLucid.Application.CapacityPlanning`.

- **CAP-01:** `WorkloadInfrastructureForecast.Demand` enumerates six workload families with explicit per-unit demand assumptions.
- **CAP-02:** `Estimate` computes CPU, worker-seconds, memory fit, SQL operations, storage consumption and capped worker recommendation over a processing window.
- **CAP-03:** `WorkloadQueueForecast` computes fluid-model backlog under supplied arrival and service windows; it does not calculate latency percentiles.
- **CAP-04:** `WorkloadCalibration.Assess` accepts revisioned observation metadata and rejects process-wide measurements for isolated-operation calibration. This is a validation foundation, not an automatic benchmark importer.
- **CAP-05:** Caller-provided unit prices yield advisory cost totals. Memory is a simplified GiB × worker-second proxy; it is not a billed allocated capacity model. No live cloud prices are assumed.
- **CAP-06:** `WorkloadForecastAccuracy.Compare` computes single-observation absolute and percentage errors; percentage is undefined for zero observations. It does not yet implement persisted historical reports or CI regressions.

**Limitations:** Per-unit rates remain caller-supplied. The inputs are not bound to real tenant telemetry, and this version does not include versioned JSON import/export, CI reporting, production calibration, queuing percentiles, external provider throttling, SQL tier-specific throughput sizing, or real autoscaling controls. No tenant details or production operational policies are changed.

The worker recommendation is advisory only and assumes parallelizable CPU and worker time. Peak memory is checked against per-worker allocation, not multiplied by worker count. No inference of reliability or capacity SLAs is justified without measured workload fixtures and validated service times.

Use representative measured inputs and deployment-specific cost rates before planning purchases or setting quotas.
