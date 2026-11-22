# Architecture #5: disposable SQL dependency failure and integrity drill

This is an **opt-in SQL Server integration test**, not an automatic CI fault injection.

The test holds a write lock on one row in a uniquely named SQL global temporary table, attempts a competing write with a 500 ms lock timeout, verifies SQL error 1222, rolls back the blocked transaction, confirms the original value remains intact, retries the write, and verifies the expected final value. It records lock timeout and retry timings in JSON.

## Safety

- Set up a disposable, migrated SQL integration catalog whose **Initial Catalog starts with `ArchLucidFaultTest_`**. The existing persistence fixture uses `ARCHLUCID_PERSISTENCE_SQL_CONNECTION` (verify the current fixture environment-variable name before running).
- Use a dedicated SQL Server instance or database. The test creates only a uniquely named global temporary table; it does not lock or modify application tables.
- Explicit opt-in is mandatory; the default focused CI **only compiles**.
- Execution is bounded by a 30-second cancellation token; cleanup is attempted in a finally block.
- Never run against production or a shared developer database.

```bash
export ARCHLUCID_ENABLE_SQL_FAULT_DRILL=I_APPROVE_DISPOSABLE_SQL_FAULT_DRILL
export ARCHLUCID_SQL_FAULT_DRILL_OUTPUT=artifacts/sql-fault-recovery.json
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj \
  -c Release --filter 'FullyQualifiedName~SqlDependencyRecoveryDrillTests'
```

The JSON is SQL-only rollback and retry evidence. It **does not establish application service recovery** after SQL outage, data integrity across multiple business tables, or recovery time objectives. Next stage requires an isolated API deployment with a test-only SQL dependency proxy and business-level consistency assertions.
