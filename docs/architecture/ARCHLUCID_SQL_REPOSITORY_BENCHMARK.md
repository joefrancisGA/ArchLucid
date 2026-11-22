# Repository-backed SQL benchmark (opt-in)

`SqlRunRepositoryBenchmarkSmokeTests` uses the existing SQL Server integration fixture and **actual** `SqlRunRepository.SaveAsync` and `GetByIdAsync` methods. It seeds 1,000 run records (setup excluded), then measures 1,000 scoped repository reads with four workers. It emits JSON with p50/p95/p99, elapsed time, sample count, batch ID and commit.

This is not the synthetic table runner in PR #7623. It requires a working, migrated SQL integration fixture and **must never be enabled against production or a shared database**. Seeded runs are retained in the disposable test database; the test does not perform destructive cleanup. CI builds the test project but never enables the opt-in workload.

Run only after provisioning a disposable, isolated SQL integration environment according to the existing test fixture instructions:

```sh
export ARCHLUCID_ENABLE_SQL_REPOSITORY_BENCH=I_APPROVE_ISOLATED_BENCHMARK
export ARCHLUCID_SQL_REPOSITORY_BENCH_OUTPUT=artifacts/sql-repository-smoke.json
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj \
  -c Release --filter 'FullyQualifiedName~SqlRunRepositoryBenchmarkSmokeTests'
```

A 10-minute cancellation deadline bounds the test's seeding and measurement. Results are environment-specific and are not production SLOs. Before using numbers for decisions, record SQL version/tier, database size, indexes, machine configuration, run repetitions and SQL resource telemetry. Follow-on work should add warmed repeated trials and update contention, plus safe fixture cleanup.
