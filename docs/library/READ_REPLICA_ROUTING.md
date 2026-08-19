> **Scope:** Read-scale-out and `SqlServer:ReadReplica` routing for analytical SQL — audience is operators and backend engineers configuring persistence; not the full consistency model (see **`DATA_CONSISTENCY_MATRIX.md`**) or customer-facing SLA text.

# Read replica routing (analytical queries)

ArchLucid can offload read-mostly analytical SQL from the primary using Azure SQL Database **Read Scale-Out** (`Application Intent=ReadOnly`) or an equivalent read-only endpoint.

## Configuration

| Key | Purpose |
| --- | --- |
| `ArchLucid:Persistence:ReadOnlyConnectionStringTemplate` | Connection string template for read-scale-out queries. In **single-catalog** mode this is a full connection string (include `Application Intent=ReadOnly`). In **per-tenant catalog** mode it mirrors `ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate` but targets the read listener. |
| `SqlServer:ReadReplica:*` | Legacy/global read routing for authority run lists, governance resolution reads, and golden manifest lookups (see `DATA_CONSISTENCY_MATRIX.md`). |

When `ReadOnlyConnectionStringTemplate` is **empty**, analytical repositories transparently use the primary connection (existing tests and single-DB pilots behave unchanged).

**Ship path:** `appsettings.json` ships an explicit empty `ArchLucid:Persistence:ReadOnlyConnectionStringTemplate` placeholder (no secrets). Hosted Staging/Production stay on primary until ops injects `ArchLucid__Persistence__ReadOnlyConnectionStringTemplate` (and optional `SqlServer__ReadReplica__*` keys) via environment or Key Vault.

## Staging / production enablement (perf wave 8)

1. Ensure Azure SQL read scale-out or geo-secondary is provisioned (`enable_read_replica` in `infra/modules/azure-sql-serverless-app`, default **true**).
2. Set API/Worker env **`ArchLucid__Persistence__ReadOnlyConnectionStringTemplate`** to a connection string that includes **`Application Intent=ReadOnly`** (see examples below).
3. Optionally set **`SqlServer__ReadReplica__AuthorityRunListReadsConnectionString`** and **`SqlServer__ReadReplica__FailoverGroupReadOnlyListenerConnectionString`** for run-list / governance / golden-manifest routes.
4. Confirm `/health/ready` **`sql-read-replica`** is Healthy (session `Updateability` must not be `READ_WRITE`).
5. Knobs are documented in `infra/environments/staging.example.tfvars` and `prod.example.tfvars`.

**There is no application feature flag** — non-empty config activates routing that already ships in `SqlStorageProviderRegistrar`.

Example (single catalog):

```text
Server=tcp:myserver.database.windows.net,1433;Database=ArchLucid;Application Intent=ReadOnly;Authentication=Active Directory Default;Encrypt=True;
```

Example (per-tenant template):

```text
Server=tcp:myserver.database.windows.net,1433;Database=__placeholder;Application Intent=ReadOnly;Authentication=Active Directory Default;Encrypt=True;
```

## Routed repositories

These types use `IReadOnlyDbConnectionFactory` for **Query** paths only; writes stay on the primary `ISqlConnectionFactory` / `IDbConnectionFactory`:

| Repository | Read paths |
| --- | --- |
| `SqlFindingsSnapshotRepository` | `GetByIdAsync`, `ListFindingRecordsKeysetAsync` |
| `DapperAuditRepository` | All search/list/export reads; `AppendAsync` stays on primary |
| `DapperComplianceDriftFindingsTrendReader` | Drift trend aggregations over `dbo.AuditEvents` |
| `AgentExecutionTraceRepository` | `GetByTraceIdAsync`, `GetByRunIdAsync`, `GetPagedByRunIdAsync`, `GetPagedSummariesByRunIdAsync`, `CountByRunIdAsync`, `GetByTaskIdAsync`, LLM cost slices, distinct agent-type probes; creates/patches/hard-delete stay on primary |
| `ComparisonRecordRepository` | `GetByIdAsync`, `GetByRunIdAsync`, `GetByExportRecordIdAsync`, `SearchAsync`, `SearchByCursorAsync`; `CreateAsync` / `UpdateLabelAndTagsAsync` stay on primary |

**Sponsor ROI summary** run enumeration continues to use `IAuthorityRunListConnectionFactory` (`SqlServer:ReadReplica`) because there is no dedicated ROI aggregation repository.

## Consistency

Read-scale-out secondaries are **eventually consistent** (typically seconds behind sustained write load). Dashboards, audit search, and drift charts may briefly lag commits on the primary. See `DATA_CONSISTENCY_MATRIX.md`.

## Health check

`/health/ready` includes `sql-read-replica` when `ReadOnlyConnectionStringTemplate` is configured. The probe runs `SELECT 1` and `DATABASEPROPERTYEX(DB_NAME(), 'Updateability')`; it reports **Unhealthy** when the session lands on `READ_WRITE` (misconfigured routing).

## Security / cost / reliability

- **Security:** Read-only intent uses the same Entra / SQL auth surface as the primary; no additional secrets when using managed identity.
- **Scalability:** Offloads analytical read load from the write primary; complements (does not replace) `SqlServer:ReadReplica` routes for run lists.
- **Reliability:** Empty template falls back to primary; misconfiguration surfaces via `sql-read-replica` readiness.
- **Cost:** Azure SQL read scale-out consumes secondary compute; disable the template on single-DB dev hosts to avoid unnecessary replicas.
