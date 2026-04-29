# Backend performance review — implementation status

This document tracks work done against the Backend Performance Review plan (indexes, keyset pagination, N+1
reductions, caching, artifact metadata-only reads, watchdog).

## Done in tree

- **Indexes**: See migrations `123`–`126` and `ArchLucid.Persistence/Scripts/ArchLucid.sql` for greenfield alignment
  (runs scope index, finding filter indexes, audit `EventType` index, background jobs `Running` filtered index).
- **Run lists**: Keyset pagination for runs (`IRunRepository`, `CachingRunRepository`, API responses) with
  `CursorPagedResponse`.
- **Findings**: `IFindingsSnapshotRepository.ListFindingRecordsKeysetAsync` with SQL (`SqlFindingsSnapshotRepository`) and
  in-memory emulation (`InMemoryFindingsSnapshotRepository`).
- **Artifacts**: `IArtifactBundleRepository.GetByManifestIdAsync(..., loadArtifactBodies, ct)`; relational load omits
  `Content` when `loadArtifactBodies` is false; artifact list paths use metadata-only bundles; full export/download
  paths pass `true`.
- **Background jobs**: `IBackgroundJobRepository.ResetStaleRunningJobsOlderThanAsync` plus
  `BackgroundJobStuckRunningWatchdogHostedService` (durable mode) registered from
  `RegisterDurableBackgroundJobInfrastructure`.
- **Audit HTTP (`/v1/audit`, `/v1/audit/search`)**: `CursorPagedResponse<AuditEvent>` with optional opaque `cursor`
  (`AuditEventCursorCodec`); **`take` + 1** computes `HasMore`/`NextCursor`; operator UI uses `items` / `nextCursor` /
  `hasMore` for load-more.
- **Findings relational write**: `InsertFindingChildrenAsync` batches related nodes, recommended actions, properties,
  and trace lists with chunked multi-row `VALUES` (parameter budget–aware chunk sizes).
- **Findings relational read**: `FindingsSnapshotRelationalRead.LoadRelationalSnapshotAsync` uses **one**
  `QueryMultipleAsync` round-trip for slice rows associated with snapshot records.

## Partial / follow-up

- **Artifacts keyset paging**: Dedicated `ArtifactBundleArtifacts` paged SQL + `artifactType`/`format` filters (plan)
  was not added; descriptors now avoid pulling `NVARCHAR(MAX)` content via `loadArtifactBodies: false`.
- **Caching**: Runs list TTL caching is implemented; decorator cache for `GetById` on findings snapshots (plan TTL
  ~120s) remains optional wiring (`Caching*` wrapper).

## Operational notes

- **Security**: Empty `ConnectionStrings:ArchLucid` is rejected at startup; InMemory test hosts use
  `ArchLucid.TestSupport.InMemoryStartupSqlConnectionStringSentinel` so configuration validation passes (no SQL connection
  is opened when storage is in-memory). Stuck-job reset applies only when `RetryCount < MaxRetries`; jobs at max retries
  stay `Running` until ops intervene (avoids infinite retry storms).
- **Reliability**: Watchdog polls every minute; stale threshold defaults to **10 minutes** Running age (UTC comparison).
- **Cost**: Metadata-only artifact reads reduce IO/CPU versus selecting `Content` for every artifact row.
