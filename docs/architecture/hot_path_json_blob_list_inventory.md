# Hot-path JSON blob list inventory (TB-929 / TB-931)

**Backlog:** TB-929 (Done 2026-07-23); TB-931 (Done 2026-08-05)  
**Rule:** list/summary queries omit fat `*Json` columns by default; detail/export/forensics opt in explicitly.

## Slim by default (verified)

| Surface | Repository / shape | Omitted blob | Notes |
| --- | --- | --- | --- |
| Run dashboard lists | `HotPathRelationalQueryShapes` + `RunListSql` | `EngineProvenanceJson` | TB-585 |
| Audit timeline / search | `AuditEventListSql` + `HotPathRelationalQueryShapes` | `DataJson` unless `IncludeDataJson` | TB-577 |
| Finding keyset list | `FindingRecordListSql` + `ListFindingRecordsKeysetAsync` | `PayloadJson` | metadata columns only (title/severity already columnar) |
| Trace operator list | `AgentExecutionTraceListSql` + `GetPagedSummariesByRunIdAsync` | full `TraceJson` to app | typed hot scalars preferred (TB-931); `JSON_VALUE` COALESCE for rolling-deploy / pre-dual-write rows |
| Trace count | `CountByRunIdAsync` | `TraceJson` | trust card / totals |
| LLM cost rollup | `AgentExecutionTraceLlmCostProjectionSql` | full `TraceJson` deserialize | typed token columns preferred (TB-931); `JSON_VALUE` COALESCE fallback |
| Weekly critical findings sample | `DapperWeeklyArchitectureCriticalFindingSummaryRepository` | `PayloadJson` | title/category only |
| Evidence proposals list | `AgentResultListSql.ListEvidenceProposalsSelectColumns` | `ResultJson` | needs `ProposedEvidenceJson` by purpose |
| Rollup/compare agent results | `AgentResultListSql.GetByRunIdSelectRollupProjection` + `GetRollupProjectionByRunIdAsync` | bare full `ResultJson` | TB-2053 — JSON subpaths for claims/findings/controls only |
| Comparison history / search | `ComparisonRecordListSql` + `ComparisonRecordRepository` list methods | `PayloadJson` | TB-2057 — detail via `GetByIdAsync` only |
| Authority run detail (operator enrich) | `IRunDetailQueryService.GetRunDetailForOperatorEnrichAsync` | bare full `ResultJson` | TB-2119 — rollup projection + mute/trust; full LOB via `GetRunDetailAsync` / architecture review route |
| Authority run detail (default) | `IAuthorityQueryService.GetRunDetailAsync` | artifact LOB bodies | TB-2059 — metadata-only bundle; bodies via `IArtifactQueryService` or `loadArtifactBodies: true` |

## Intentional full-blob readers (documented)

| Surface | Method | Blob | Why |
| --- | --- | --- | --- |
| Run detail by id | `SqlRunRepository.GetByIdAsync` | `EngineProvenanceJson` | single-row detail (not a list) |
| Agent results by run | `AgentResultRepository.GetByRunIdAsync` | `ResultJson` | commit/detail/forensics — operator enrich uses TB-2119 rollup projection; buyer-summary uses TB-930 markers |
| Trace forensics | `GetPagedByRunIdAsync` | `TraceJson` | internal operator forensics endpoint |
| Trace by id / task / full run | `GetByTraceIdAsync`, `GetByTaskIdAsync`, `GetByRunIdAsync` | `TraceJson` | forensic / orchestration detail |
| Finding inspect | `DapperFindingInspectReadRepository` | `PayloadJson` | single-finding inspect |
| Comparison record by id | `ComparisonRecordRepository.GetByIdAsync` | `PayloadJson` | single-row detail (not a list) |
| Authority run detail (opt-in bodies) | `IAuthorityQueryService.GetRunDetailAsync(loadArtifactBodies: true)` | artifact LOB bodies | explicit when inline artifact content required |
| Findings snapshot load | `SqlFindingsSnapshotRepository.GetByIdAsync` / relational read | `FindingsJson` / `PayloadJson` | detail/export |
| Audit export | `AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock` | includes `DataJson` | explicit export flag |

## Residual JSON-only / RMW notes (TB-931)

- **Authority for nested forensics:** full `TraceJson` remains the source for prompts, response text, citations, and other nested fields not dual-written.
- **Quality patches:** `PatchQualityWarningAsync` / `PatchQualityRejectedAsync` still RMW `TraceJson` for forensics consistency and dual-write `QualityWarning` / `QualityRejected` columns. Cost/list paths do **not** use that RMW.
- **Finding `PayloadJson`:** list already uses columnar title/severity; no additional typed-column migration in this ship.
- **Rolling deploy:** list/cost SQL prefer typed columns via `COALESCE`/`CASE` with `JSON_VALUE` fallback so older writers without dual-write do not under-report.

## Drift guards

- `ArchLucid.Persistence.Tests/Sql/HotPathRelationalQueryShapeTests.cs` — run/audit/trace/finding/agent-result/comparison list constants (typed-column preference + no bare `TraceJson`)
- `AgentExecutionTraceRepositoryContractTests.GetPagedSummariesByRunIdAsync_returns_summary_slice_and_total`

## Measurement note

Qualitative expectation: operator trace list and trust-card count avoid shipping/deserializing full `TraceJson` per row into the app; cost rollups prefer typed token columns. Before/after SQL duration + response payload size should be captured on the next staging load test (not in scope for this pass).

## Files changed (TB-929 / TB-931)

- `ArchLucid.Persistence/Migrations/294_AgentExecutionTraces_HotScalarColumns.sql` + `ArchLucid.sql` brownfield ALTERs
- `AgentExecutionTraceListSql.cs` / `AgentExecutionTraceLlmCostProjectionSql.cs`
- `AgentExecutionTraceRepository.cs` (Create dual-write; quality column dual-write)
- `HotPathRelationalQueryShapeTests` + inventory
