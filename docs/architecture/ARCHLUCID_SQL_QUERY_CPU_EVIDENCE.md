# SQL Server cached-query CPU evidence

The SQL repository benchmark captures a read-only cumulative `SUM(total_worker_time)` from `sys.dm_exec_query_stats` before and after the timed workload, alongside SQL process-memory snapshots and the existing client CPU/read latencies. SQL Server documents `total_worker_time` in microseconds, representing **CPU time consumed by completed executions of currently cached plans**, not total SQL Server process CPU and not exclusively this test. The observer converts to whole milliseconds; coarse measurements can round small values down.

The sample is instance-wide and plan-cache-dependent. Plan compilation, eviction, reset, unrelated activity, in-flight executions and DMV permissions make it unsuitable for isolated resource attribution. A decrease or missing counter yields a null delta rather than zero. Fields are named `serverCachedQueryWorkerCpu...` to avoid claiming true process CPU; memory is before/after, not peak.

No hard gate, billing calculation, production query, or worker-sizing calibration is triggered. To calibrate SQL tier capacity, use an isolated database host or correctly scoped SQL resource monitoring and repeated matched workloads, validating counters against platform telemetry.
