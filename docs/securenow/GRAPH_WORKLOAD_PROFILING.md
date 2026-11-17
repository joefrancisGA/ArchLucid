# SecureNow graph workload profiling

`SecureNowGraphWorkloadProfiler.MeasureAsync` wraps an awaited, caller-supplied structural graph operation, recording prefix count, traversed edges, visited nodes, truncation, elapsed wall time, process CPU-time delta, and process working-set snapshots.

**Measurement limitations:** TotalProcessorTime is process-wide and includes other concurrent work. Working-set readings before/after are NOT the real peak between samples. The `WorkingSetObservedMaxBytes` field is only the maximum of two observations. Therefore this output must not be used as isolated per-operation CPU or peak RAM calibration without a dedicated single-workload benchmark host and independent sampling. Failed and cancelled operations return no success profile. No tenant identifiers, graph vertices, or evidence content are captured.

This component is an instrumentation primitive, not an automatically scheduled benchmark job or production telemetry pipeline. It does not alter graph computations, admission policies, or security evidence. Connect it to dedicated benchmark fixtures and persist artifacts with environment/build metadata before using the data in cost predictions.
