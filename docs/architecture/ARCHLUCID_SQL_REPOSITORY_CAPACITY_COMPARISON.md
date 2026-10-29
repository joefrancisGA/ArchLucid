# SQL repository benchmark comparison

`scripts/ci/compare_archlucid_sql_capacity.py` compares two versioned JSON artifacts produced by `Benchmark_real_scoped_path_repository_reads`. The tool requires identical backend, seeded path count, hops per path, concurrency and query count, plus explicit baseline/current source revisions. It reports absolute and percentage changes in p50/p95 wall-clock latency; zero baseline values yield undefined percentage changes. Comparison is **advisory** with no hard CI gate.

Example:

```sh
python3 scripts/ci/compare_archlucid_sql_capacity.py \
 --baseline artifacts/baseline/sql-repository-1000-1.json \
 --current artifacts/capacity/dedicated/sql-repository-1000-1.json \
 --baseline-revision BASE_SHA --current-revision HEAD_SHA \
 --output artifacts/capacity/sql-repository-comparison.json
```

No baseline is manufactured. The existing benchmark produces measurements only when the test workflow runs. These SQL read latency observations are **not** CPU-seconds, memory consumption, SQL vCore utilization, or worker-service times. Do not automatically populate `WorkloadCalibration` with these measurements. True infrastructure sizing still requires dedicated process and SQL-server resource telemetry for matched workload and hosting environments.
