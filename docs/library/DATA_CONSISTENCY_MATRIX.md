> **Scope:** Contributor-reference — Data consistency matrix - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Data consistency matrix

**Last reviewed:** 2026-04-17 (trial lifecycle hard purge: `SqlTenantHardPurgeService` deletes tenant-scoped `dbo` rows in bounded batches; `dbo.AuditEvents` retained; see `TenantHardPurgeServiceSqlIntegrationTests`; prior **2026-04-16** — run archival cascades include ArtifactBundles, AgentExecutionTraces, ComparisonRecords **ArchivedUtc** when migration **073** is applied; see `SqlRunRepositoryArchivalCascadeTests`, `SqlRunRepositoryArchivalExtendedCascadeTests`)

This document states **what consistency guarantees callers should assume** for major aggregates. It complements `docs/SQL_DDL_DISCIPLINE.md` and `docs/API_CONTRACTS.md`.

## Objective

Make explicit which paths are **strongly consistent** (read-your-writes within a transaction), **transactionally outboxed** (eventually processed), or **eventually aligned** (cross-service).

**PA / procurement matrix (TB-1011):** finalize UoW vs outbox/async + never-silent best-effort — [`TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md`](TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) (**TB-1011** Done). Honesty CI follow-on: **TB-1012**.

## Assumptions

- Primary authority state lives in **`dbo.Runs`** and related authority tables scoped by tenant/workspace/project.
- Coordinator-facing tables use string **`RunId`** (no-dash hex) as a **logical** correlation key aligned with **`dbo.Runs.RunId`**; referential integrity to **`dbo.Runs`** is application-enforced (migration **047** dropped legacy FKs to **`ArchitectureRuns`**; migration **049** dropped the legacy table).
- A strongly typed **`RunId`** value object exists in **`ArchLucid.Core.Identity`** for gradual adoption at API and persistence boundaries; most code paths still use **`Guid`** today.

## Matrix

| Aggregate / flow | Consistency | Mechanism | Notes |
|------------------|------------|-----------|--------|
| Create architecture request (review) + authority pipeline | Per-connection transactional | SQL transactions in orchestrator | Committed rows visible after successful commit. **Sync CreateRun (AsyncAuthorityPipeline=false):** ArchitectureRequest is persisted **before** the early-committed `dbo.Runs` header so a crash cannot leave `runs_missing_architecture_request` orphans (**TB-2190**). Enlisted/async CreateRun keeps request + run in one UoW. |
| Runs missing ArchitectureRequest (orphan header) | Detection + bounded soft-archive | Reconciliation `runs_missing_architecture_request` + `MissingArchitectureRequestRunRemediator` / `DataConsistency:AutoRemediateMissingArchitectureRequestRuns` | Non-archived runs whose `ArchitectureRequestId` is missing from `dbo.ArchitectureRequests` and older than grace (**default 15 minutes**) soft-archive via `ArchiveRunsByIdsAsync`. Admin: `GET`/`POST /v1/admin/diagnostics/data-consistency/missing-architecture-request-runs`. Auto-remediation refreshes reconciliation health after archives. |
| Run optimistic concurrency | Row-level | `ROWVERSION` on `dbo.Runs` (and selected tables) | Conflicting updates → `409` with conflict problem type. |
| Committed run header evidence anchors | Strong (post-commit) | `TR_Runs_SealCommittedHeader` + `CommittedRunHeaderAnchorGuard` (migration 250, TB-310) | Snapshot/manifest FK pointers and scope identity frozen once `GoldenManifestId` is set; lifecycle columns (`LegacyRunStatus`, `ArchivedUtc`, flags, governance) remain mutable. ADR 0045. |
| Retrieval indexing after commit | Eventual | Transactional enqueue + worker processing | Enqueue is tied to commit transaction where configured; indexer may lag. |
| Run export blob push (`POST .../export/push`) | Eventual (at-least-once) | `dbo.RunExportBlobPushOutbox` + leader-elected worker | Operator action on committed run; ZIP rebuilt at processing; SAS URL re-validated; dead-letter on exhaustion. ADR 0043. |
| Post-commit projections (authority run commit) | Eventual (at-least-once) | `dbo.PostCommitProjectionOutbox` + leader-elected worker | Provenance, review-completed, sample purge, rerank, IaC stubs; feature gates at enqueue; dead-letter on exhaustion. ADR 0044. |
| Idempotency key on create run | Scoped replay-safe | Hash of body + scope keys | Treat as **best-effort** under extreme duplicate-key races; authority **`dbo.Runs`** is the durable header. |
| Demo trusted-baseline seed | Transactional per repository | **`IRunRepository.SaveAsync`** / **`UpdateAsync`** on **`dbo.Runs`** plus coordinator rows | No legacy table write path. |
| Multi-tenant isolation (SQL) | Defense in depth | Database-per-tenant routing + application scope predicates; see ADR 0037. | Not every table carries scope columns; child tables use repository join discipline. See `docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md`. |
| Trial lifecycle → hard purge (DPA) | Eventual / operator-retryable | `TrialLifecycleSchedulerHostedService` + `TrialLifecycleTransitionEngine` + `SqlTenantHardPurgeService` (`SqlRowLevelSecurityBypassAmbient`) | Transitions are idempotent per `TryRecordTrialLifecycleTransitionAsync`; purge runs in `DELETE TOP` loops; `dbo.AuditEvents` excluded from purge; failed purge leaves `TrialStatus=Deleted` for retry. See `docs/runbooks/TRIAL_LIFECYCLE.md`. |
| Policy pack assignments | Per-row transactional | SQL writes | `ROWVERSION` on assignments supports future optimistic flows. |
| LLM completion cache | Best-effort | Distributed/memory cache | Cache hits do not consume Azure usage; stale entries TTL-bound. |
| Hot-path read cache (runs, golden manifests, policy pack metadata) | Read-through + TTL | `IHotPathReadCache` (memory or Redis; see `HotPathCache:*`) | **Does not cache list endpoints** (e.g. runs list). **Single-row writes** remove the matching key (`Save`/`Update` on runs; `Save` on manifests; `Create`/`Update` on policy packs). **Bulk run archival** (`ArchiveRunsCreatedBeforeAsync`) removes **each archived run’s** cache key using `OUTPUT` scope columns so operators do not see archived runs until TTL expiry. Remaining risk: TTL-bound staleness if data changes **outside** these repository methods (ad-hoc SQL, future writers). |
| Orphan authority snapshot rows (missing `dbo.Runs`) | Operator-controlled quarantine + detection | `DataConsistencyOrphanProbeHostedService` + `DataConsistencyOrphanProbeRegistry` + `DataConsistency:Enforcement` | Background probe counts **`GoldenManifests`**, **`FindingsSnapshots`**, **`ContextSnapshots`**, **`GraphSnapshots`**, **`ArtifactBundles`**, **`RunStageOutcomes`**, and forensic **`RetrievalGroundingTrace`** rows whose **`RunId`** is missing from **`dbo.Runs`**. **`Mode=Quarantine`** inserts idempotent rows into **`dbo.DataConsistencyQuarantine`** for golden/findings orphans (bounded by **`MaxRowsPerBatch`**). Retrieval grounding traces are detection-only: do not auto-delete forensic evidence. Emits **`archlucid_data_consistency_orphans_detected_total`** and **`archlucid_data_consistency_orphans_quarantined_total`**. Other **`FK_*_Runs_RunId`** tables are registry opt-outs with documented rationale (CI guard in **`DataConsistencyOrphanProbeRegistryArchitectureTests`**). |
| Committed run header FK repoint (dangling / cross-run child links) | Detection-only | `DataConsistencyOrphanProbeExecutor` + `CommittedRunHeaderFkRepointRegistry` | For committed runs (`GoldenManifestId IS NOT NULL`), counts header evidence pointers (`ContextSnapshotId`, `GraphSnapshotId`, `FindingsSnapshotId`, `GoldenManifestId`, `DecisionTraceId`, `ArtifactBundleId`) whose child row is missing or owned by another run. Emits **`archlucid_data_consistency_header_repoints_detected_total`** (label **`pointer`**). Admin: **`GET /admin/diagnostics/data-consistency/header-repoints`**. No auto-delete (forensic signal). ADR 0046 / TB-311. CI guard: **`CommittedRunHeaderFkRepointProbeRegistryArchitectureTests`**. |

## Runs authority convergence (complete)

Dual persistence (**`ArchitectureRuns`** vs **`Runs`**) is **retired** in supported deployments:

- **ADR 0012** — **Completed** (2026-04-12): **`IArchitectureRunRepository`** and **`dbo.ArchitectureRuns`** removed; reads and writes use **`IRunRepository`** / **`dbo.Runs`**.
- **ADR 0002** — **Superseded** by ADR 0012 completion (both ADRs removed 2026-08-02 — see [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02)).

## Read-replica staleness expectations

When read replica routing is enabled (via **`ReadReplicaRoutedConnectionFactory`** and **`SqlServerOptions`**), read-only queries may hit an Azure SQL **readable secondary**. Writes always go to the **primary**. That path is **eventually consistent**: a successful write on the primary may not appear on a replica-bound read for a short interval.

| Scenario | Expected lag | Mitigation |
|----------|-------------|------------|
| Normal steady-state | Usually under **5 seconds** | Acceptable for list views, dashboards, and search-style reads |
| Heavy write burst (bulk archival, large seed) | **10–30 seconds** or more | Operators should wait and refresh; **`IHotPathReadCache`** reduces perceived lag for single-row reads that go through cache-invalidating repository methods |
| Geo-dr / failover group failover | **Minutes** (RPO/RPO per Azure SLA) | Follow database failover runbooks; app health checks reflect DB readiness |

### Which queries may hit the replica?

Services resolved through **`ReadReplicaRoutedConnectionFactory`** (per route enum, e.g. authority run list, governance resolution reads, golden manifest lookup) use the replica connection when configured. Examples include run list/search, some governance dashboard reads, and read-only manifest lookups.

Single-row hot-path reads may still be satisfied from **`IHotPathReadCache`**, which is invalidated on documented write paths; TTL remains a back-stop if data changes outside those writers.

### Queries that should stay on the primary

- All **`INSERT` / `UPDATE`** paths inside **`IArchLucidUnitOfWork`**
- Read-your-writes inside an open transaction (UoW connection)
- Health probes that must reflect primary connectivity

### Operator guidance

If a list view looks stale immediately after a write, wait briefly and refresh. For suspected replica issues during bulk operations, temporarily disable replica routing (**`ReadReplica:Enabled=false`**) only with operational awareness of added primary load.

## Archival cascade (runs)

| Area | Behavior today | Notes |
|------|----------------|--------|
| **`dbo.Runs`** | **`ArchivedUtc`** soft-archive on bulk archival | Primary visibility gate for run lists that respect archival |
| **`dbo.GoldenManifests` / `dbo.FindingsSnapshots`** | **`ArchivedUtc`** set in the **same transaction** as parent **`dbo.Runs`** bulk / by-id archival | Migration **`066_GoldenManifestsFindingsSnapshots_ArchivedUtc.sql`**; **`SqlRunRepository`** batch |
| **`dbo.ContextSnapshots` / `dbo.GraphSnapshots` / `dbo.DecisioningTraces`** | **`ArchivedUtc`** set in the **same transaction** as parent **`dbo.Runs`** bulk / by-id archival (RunId-aligned) | Migration **`067_ContextGraphDecisioning_ArchivedUtc.sql`**; **`SqlRunRepository`** batch; integration coverage in **`ArchLucid.Persistence.Tests/SqlRunRepositoryArchivalCascadeTests.cs`** |
| **`dbo.ArtifactBundles` / `dbo.AgentExecutionTraces` / `dbo.ComparisonRecords`** | **`ArchivedUtc`** set in the **same transaction** as parent **`dbo.Runs`** bulk / by-id archival (RunId-aligned; comparison rows match **`TRY_CAST(LeftRunId/RightRunId)`** to archived run ids) | Migration **`073_ArtifactBundlesAgentTracesComparisons_ArchivedUtc.sql`**; **`SqlRunRepository`** batch; integration coverage in **`SqlRunRepositoryArchivalExtendedCascadeTests.cs`** |
| **Coordinator artifacts** | Application-enforced consistency | Treat archived authority runs as **logically** inactive; do not assume every child FK is nulled automatically |
| **Hot-path cache** | **`ArchiveRunsCreatedBeforeAsync`** removes per-run keys via **`OUTPUT`** scope columns | See matrix row **Hot-path read cache** |

**Operator expectation:** golden manifest, findings snapshot, context snapshot, graph snapshot, decisioning trace, artifact bundle, agent execution trace, and comparison rows tied to an archived run carry **`ArchivedUtc`** alongside **`dbo.Runs`** when those columns exist in the catalog; list/detail APIs that filter on run archival should treat matching child **`ArchivedUtc`** as aligned for the families above.

**Transaction pattern:** **`IArchLucidUnitOfWork`** / **`IArchLucidUnitOfWorkFactory`** are the standard for mutating authority SQL in one transaction. A repo-wide search shows **no** `TransactionScope` usage in product `.cs` sources (as of 2026-04-14); coordinator orchestrators use the same UoW pattern for create/commit persistence. Prefer UoW for new writes.

## Operational consistency signals

| Signal | Type | Notes |
|--------|------|--------|
| **`run_golden_manifest_consistency`** (readiness) | Health check | **`RunGoldenManifestConsistencyHealthCheck`**: non-archived **`dbo.Runs`** with **`GoldenManifestId`** set but no matching **`dbo.GoldenManifests`** row → **Degraded**. Skipped when storage is InMemory. |
| **`DataConsistencyOrphanProbeHostedService`** | Background timer | SQL only; configurable via **`DataConsistency:OrphanProbeEnabled`** / **`OrphanProbeIntervalMinutes`**. Counts orphan **`RunId`** references on authority snapshot and forensic tables registered in **`DataConsistencyOrphanProbeRegistry`** ( **`GoldenManifests`**, **`FindingsSnapshots`**, **`ContextSnapshots`**, **`GraphSnapshots`**, **`ArtifactBundles`**, **`RetrievalGroundingTrace`** ); logs warning and emits **`archlucid_data_consistency_orphans_detected_total`** (detection-only except configured quarantine for supported snapshot families). **`dbo.ComparisonRecords`** uses FK-backed **`LeftRunId`/`RightRunId`** (DbUp 137) and is an explicit registry opt-out. |

## Cross-catalog write patterns (system catalog ↔ per-tenant catalog)

Applies only in `SqlTopologyMode.SystemWithPerTenantCatalogs`. In `SingleCatalog` mode both references hit the same physical database.

**Invariant (SAQ-005, 2026-06-07):** No operation in this codebase performs a true distributed transaction (2PC / `TransactionScope`) across the system catalog and a per-tenant catalog. This invariant is verified by the absence of `TransactionScope`, `EnlistTransaction`, or cross-database ambient transaction usage in all `.cs` product sources. Any new cross-catalog write path that requires atomicity must file a superseding ADR before implementation.

| Workflow | System catalog write | Per-tenant catalog write | Atomicity | Partial-failure posture |
|---|---|---|---|---|
| **Tenant provisioning** (`SqlTenantSqlCatalogProvisioner.ProvisionTenantCatalogAsync`) | `dbo.TenantDatabaseBindings` (upsert pending → active/failed); read `dbo.Tenants` for mirror | Schema migration; mirror `dbo.Tenants` row; initial workspace/project rows | **None** — sequential saga steps | Saga logs "manual cleanup may be required"; binding marked Failed on schema/migration error; idempotent retry supported |
| **Tenant directory mirroring** (`DapperTenantRepository` lifecycle methods: `SuspendTenantAsync`, erasure offboard/restore/legal-hold) | `UPDATE dbo.Tenants` lifecycle fields | Same `UPDATE` in tenant-mirror `dbo.Tenants` | **None** — two separate connections | Column-authority matrix (TB-313) documents write ownership per column; CI guard detects authority drift; partial failure leaves visible state divergence until next admin retry |
| **Tenant deletion** (`TenantDeletionService.DeleteTenantAsync`) | `INSERT dbo.PlatformAuditEvents` (after purge) | `DELETE` tenant-scoped rows via `SqlTenantHardPurgeService` | **None** — sequential | Purge completes first; audit append is best-effort post-step; no rollback |
| **Cross-tenant rollup** (`InternalCrossTenantRollupProcessor`) | `INSERT/UPDATE dbo.InternalCrossTenantRollupDaily` | Reads only (no write) | N/A — read + system write | Eventual consistency by design; background job |

**Core product paths write to exactly one catalog per operation (single-catalog invariant):**

- Run create / execute / commit — `IArchLucidUnitOfWork` on tenant catalog only
- Outbox enqueue (all families) — tenant catalog, inside UoW transaction
- Usage metering — tenant catalog, post-commit best-effort
- Run archival, retention purge — tenant catalog only
- All authority snapshot tables — tenant catalog

## Related

- [`docs/redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02) — removed ADRs 0002, 0012
- `docs/library/LIVE_E2E_HAPPY_PATH.md` — scripted HTTP happy path references.
