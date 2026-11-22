# SQL smoke benchmark v1

This opt-in tool measures **real SQL Server operations on a dedicated synthetic fixture table**, not the production `SqlRunRepository` or full ArchLucid pipeline. It is a stepping stone to a repository-integrated benchmark. No performance claim or CI latency gate is implied.

## Safety

Use an isolated SQL database named `ArchLucidCapacityTest_*` and an identity restricted to that database. The runner requires `--approval I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES`, an exact matching connection-string catalog, encrypted TLS with certificate validation, and `ARCHLUCID_SQL_BENCH_CONNECTION` (never pass credentials on the command line). It creates `dbo.ArchLucidSqlSmokeRuns` if missing and deletes **only its own batch rows** on normal completion or caught failure. Do not point it at shared or production infrastructure. It cannot guarantee cleanup after a process kill: abandoned batch rows may require operator review. The table itself is retained.

## Smoke run

```sh
export ARCHLUCID_SQL_BENCH_CONNECTION='Server=...;Database=ArchLucidCapacityTest_Bench;Encrypt=True;TrustServerCertificate=False;...'
dotnet run --project tools/ArchLucid.SqlSmokeBench -- \
  --database ArchLucidCapacityTest_Bench \
  --approval I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES \
  --rows 1000 --workers 4 --seconds 30 \
  --output artifacts/sql-smoke/result.json
```

Hard caps: 1,000 rows, four workers, 60 measurement seconds, 10-minute overall cancellation. Seed time is excluded from measured operation latency. Read/update ratio is approximately 4:1. Deterministic per-row IDs and a unique batch ID isolate concurrent invocations. Each operation uses the same actual SQL connection and parameterized SQL; reported latencies are client-observed, not SQL server CPU timings.

The JSON evidence includes dataset size, concurrency, duration, commit (when supplied), batch identifier, latency percentiles, counts and error types. SQL host hardware, resource tier, SQL version, database settings and external SQL telemetry must be recorded separately before comparisons across environments are credible.

## Next iteration

Replace fixture SQL operations with actual scoped `SqlRunRepository` calls and migrations, after confirming isolated test schema setup and authorization. Add repeated trials, warm-up and resource telemetry. Never interpret synthetic fixture numbers as full product throughput.
