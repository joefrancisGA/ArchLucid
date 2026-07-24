# Hot-path JSON blob list inventory (TB-929)

**Backlog:** TB-929 (Done 2026-07-23)  
**Rule:** list/summary queries omit fat `*Json` columns by default; detail/export/forensics opt in explicitly.

## Slim by default (verified)

| Surface | Repository / shape | Omitted blob | Notes |
| --- | --- | --- | --- |
| Run dashboard lists | `HotPathRelationalQueryShapes` + `RunListSql` | `EngineProvenanceJson` | TB-585 |
| Audit timeline / search | `AuditEventListSql` + `HotPathRelationalQueryShapes` | `DataJson` unless `IncludeDataJson` | TB-577 |
| Finding keyset list | `FindingRecordListSql` + `ListFindingRecordsKeysetAsync` | `PayloadJson` | metadata columns only |
| Trace operator list | `AgentExecutionTraceListSql` + `GetPagedSummariesByRunIdAsync` | full `TraceJson` to app | columnar + `JSON_VALUE` for summary fields; `GET …/run/{id}/traces` |
| Trace count | `CountByRunIdAsync` | `TraceJson` | trust card / totals |
| LLM cost rollup | `AgentExecutionTraceLlmCostProjectionSql` | full `TraceJson` deserialize | TB-577 pattern |
| Weekly critical findings sample | `DapperWeeklyArchitectureCriticalFindingSummaryRepository` | `PayloadJson` | title/category only |
| Evidence proposals list | `AgentResultListSql.ListEvidenceProposalsSelectColumns` | `ResultJson` | needs `ProposedEvidenceJson` by purpose |

## Intentional full-blob readers (documented)

| Surface | Method | Blob | Why |
| --- | --- | --- | --- |
| Run detail by id | `SqlRunRepository.GetByIdAsync` | `EngineProvenanceJson` | single-row detail (not a list) |
| Agent results by run | `AgentResultRepository.GetByRunIdAsync` | `ResultJson` | commit/detail path — lazy split tracked **TB-930** |
| Trace forensics | `GetPagedByRunIdAsync` | `TraceJson` | internal operator forensics endpoint |
| Trace by id / task / full run | `GetByTraceIdAsync`, `GetByTaskIdAsync`, `GetByRunIdAsync` | `TraceJson` | forensic / orchestration detail |
| Finding inspect | `DapperFindingInspectReadRepository` | `PayloadJson` | single-finding inspect |
| Findings snapshot load | `SqlFindingsSnapshotRepository.GetByIdAsync` / relational read | `FindingsJson` / `PayloadJson` | detail/export |
| Audit export | `AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock` | includes `DataJson` | explicit export flag |

## Drift guards

- `ArchLucid.Persistence.Tests/Sql/HotPathRelationalQueryShapeTests.cs` — run/audit/trace/finding/agent-result list constants
- `AgentExecutionTraceRepositoryContractTests.GetPagedSummariesByRunIdAsync_returns_summary_slice_and_total`

## Measurement note

Qualitative expectation: operator trace list and trust-card count avoid shipping/deserializing full `TraceJson` per row into the app; run/audit/finding list paths were already slim from TB-585/TB-577. Before/after SQL duration + response payload size should be captured on the next staging load test (not in scope for this pass). Nested summary scalars still use `JSON_VALUE` until **TB-931** typed columns land.

## Files changed (this ship)

- `ArchLucid.Persistence/Sql/AgentExecutionTraceListSql.cs`
- `ArchLucid.Persistence/Sql/FindingRecordListSql.cs`
- `ArchLucid.Persistence/Sql/AgentResultListSql.cs`
- `ArchLucid.Persistence/Data/Repositories/AgentExecutionTraceRepository.cs` (+ summary row/mapper, `CountByRunIdAsync`)
- `IAgentExecutionTraceRepository` + in-memory/Cosmos implementations
- `RunQueryController.GetRunTraces`, `RunTrustEvidenceCardBuilder`
- `SqlFindingsSnapshotRepository` / `AgentResultRepository` (constants wired)
- `HotPathRelationalQueryShapeTests` + contract tests
