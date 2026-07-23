# Hot-path JSON blob list inventory (TB-929)

**Backlog:** TB-929 (Done 2026-07-22)  
**Rule:** list/summary queries omit fat `*Json` columns by default; detail/export/forensics opt in explicitly.

## Slim by default (verified)

| Surface | Repository / shape | Omitted blob | Notes |
| --- | --- | --- | --- |
| Run dashboard lists | `HotPathRelationalQueryShapes` + `RunListSql` | `EngineProvenanceJson` | TB-585 |
| Audit timeline / search | `AuditEventListSql` + `HotPathRelationalQueryShapes` | `DataJson` unless `IncludeDataJson` | TB-577 |
| Finding keyset list | `FindingRecordListSql` | `PayloadJson` | `ListFindingRecordsKeysetAsync` |
| Trace operator list | `AgentExecutionTraceListSql` + `GetPagedSummariesByRunIdAsync` | full `TraceJson` | `JSON_VALUE` extracts for summary fields |
| Trace count | `CountByRunIdAsync` | `TraceJson` | trust card / totals |
| LLM cost rollup | `AgentExecutionTraceLlmCostProjectionSql` | full `TraceJson` | TB-577 pattern |
| Weekly critical findings sample | `DapperWeeklyArchitectureCriticalFindingSummaryRepository` | `PayloadJson` | title/category only |

## Intentional full-blob readers (documented)

| Surface | Method | Blob | Why |
| --- | --- | --- | --- |
| Run detail by id | `SqlRunRepository.GetByIdAsync` | `EngineProvenanceJson` | single-row detail (not a list) |
| Agent results by run | `AgentResultRepository.GetByRunIdAsync` | `ResultJson` | commit/detail path — lazy split tracked **TB-930** |
| Trace forensics | `GetPagedByRunIdAsync` | `TraceJson` | internal operator forensics endpoint |
| Trace by id / task | `GetByTraceIdAsync`, `GetByTaskIdAsync`, `GetByRunIdAsync` | `TraceJson` | forensic / orchestration detail |
| Finding inspect | `DapperFindingInspectReadRepository` | `PayloadJson` | single-finding inspect |
| Findings snapshot load | `SqlFindingsSnapshotRepository.GetByIdAsync` | `FindingsJson` / relational `PayloadJson` | detail/export |
| Audit export | `AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock` | includes `DataJson` | explicit export flag |
| Evidence proposals list | `ListEvidenceProposalsAsync` | `ProposedEvidenceJson` | list purpose is proposal payload |

## Drift guards

- `ArchLucid.Persistence.Tests/Sql/HotPathRelationalQueryShapeTests.cs` — run/audit shapes
- Same file — `AgentExecutionTraceListSql`, `FindingRecordListSql`, `AgentResultListSql` constants
- `AgentExecutionTraceRepositoryContractTests.GetPagedSummariesByRunIdAsync_*`

## Measurement note

Qualitative expectation: operator trace list and trust-card count avoid shipping/deserializing full `TraceJson` per row; run/audit/finding list paths were already slim from TB-585/TB-577. Before/after SQL duration should be captured on next staging load test (not in scope for this pass).

## Files changed

- `ArchLucid.Persistence/Sql/AgentExecutionTraceListSql.cs`
- `ArchLucid.Persistence/Sql/FindingRecordListSql.cs`
- `ArchLucid.Persistence/Sql/AgentResultListSql.cs`
- `ArchLucid.Persistence/Data/Repositories/AgentExecutionTraceRepository.cs` (+ summary row/mapper)
- `IAgentExecutionTraceRepository` + in-memory/Cosmos implementations
- `RunQueryController`, `RunTrustEvidenceCardBuilder`
- `SqlFindingsSnapshotRepository` (uses `FindingRecordListSql`)
