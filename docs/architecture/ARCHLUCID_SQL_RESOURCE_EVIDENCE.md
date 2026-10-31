# Scoped SQL benchmark resource evidence

The real scoped security-path repository read benchmark now captures the **test process** CPU-time delta and working-set values immediately before and after the concurrent read workload, in the same JSON artifact as query p50/p95 and elapsed time. Workload seeding and the initial warm-up are excluded from the measurement interval. The output includes `resourceEvidenceStatus=PROCESS_WIDE_SQL_INSTANCE_WIDE_NOT_ISOLATED`.

`serverInstanceCpuMillisecondsDelta` is deliberately **null**, not zero: repository calls use internal pooled connections, and neither test ownership of SQL Server nor per-query SQL CPU measurement is established. SQL Server CPU and memory cannot reliably be inferred from application-side wall time or from a different connection's session counters. Before supporting SQL-resource calibration, add a SQL Server process/host metric collector with a reliable matched window and an isolated database service fixture. The client working-set values are endpoint observations, not a maximum/peak RAM measurement.

This evidence remains advisory only. Do not convert observed query latencies to per-workload CPU-seconds, use process-wide CPU deltas to claim isolation, or automatically tune cloud worker counts/SQL tiers. CI execution and representative hardware remain prerequisites to empirical capacity forecasting.
