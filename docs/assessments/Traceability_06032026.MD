> **Scope:** Evaluator — independent first-principles Traceability quality assessment; not a buyer-facing status report.

# Traceability — Solution Quality Assessment (1.97%)

**Score: 76 / 100**
**Weighted readiness contribution:** 76 × 3 / 116 = **1.97%**
**Weighted deficiency signal:** (100 − 76) × 3 = **72**
**Assessment date:** 2026-06-03
**Model:** ASSESSMENT_QUALITY_MODEL.md — ENTERPRISE, weight 3 / 116 (total 116)
**Scope:** (A) V1.1 headline readiness per `Assessment-Scope-V1_1.mdc`; items explicitly deferred to V1.1 or V2 are not penalized.

---

## Definition being scored

End-to-end auditability of decisions, findings, manifests, and governance actions — from evidence ingestion to committed output — including chain provenance, source labels, and human-review hooks.

---

## Sub-dimension breakdown

| Sub-dimension | Score | Weight | Deficiency |
|---|---:|---:|---:|
| Evidence-to-output chain provenance | 80 | 20% | 4.0 |
| Finding-level trace completeness | 75 | 18% | 4.5 |
| Decision audit trail coverage | 78 | 18% | 4.0 |
| Agent execution forensics | 83 | 12% | 2.0 |
| Authority pipeline UI trace | 60 | 12% | 4.8 |
| Human-review hooks (governance) | 88 | 10% | 1.2 |
| Evidence source labels | 74 | 6% | 1.6 |
| Retrieval indexing provenance | 60 | 4% | 1.6 |
| **Composite** | **76** | | |

---

## Scoring justification

### Strengths (why the score is not lower)

**Infrastructure is industry-leading for a V1 product.** The volume and discipline of what ships is genuinely strong:

- `ArchitectureRunProvenanceGraph` — nodes, directed edges, timeline, and a `TraceabilityGaps` auto-detection list populated at serve time.
- `ManifestProvenance` carries `SourceFindingIds`, `SourceGraphNodeIds`, and `AppliedRuleIds` persisted on every committed manifest.
- `ManifestFinalizationService` uses a single SQL transaction: `DecisioningTraces` insert + `GoldenManifests` insert + `dbo.sp_FinalizeManifest` (audit row + outbox) — no partial-commit traceability failures on the happy path.
- 251 audit event constants, CI-guarded by `assert_audit_const_count.py` and `assert_openapi_mutations_in_audit_matrix.py`. Known-gaps count in `AUDIT_COVERAGE_MATRIX.md` is **zero** as of 2026-05-25.
- `dbo.AuditEvents` has a database-level `DENY UPDATE / DENY DELETE` via migration 051 when the `ArchLucidApp` role is present — immutability backed by the DB permission layer, not just application convention.
- `AgentExecutionTrace` has full forensic storage: blob (container `agent-traces`, paths `{runId}/{traceId}/system-prompt.txt`, `user-prompt.txt`, `response.txt`) with SQL inline fallback (`FullSystemPromptInline`, `FullUserPromptInline`, `FullResponseInline` as `NVARCHAR(MAX)`) when blob fails. `BlobUploadFailed` and `InlineFallbackFailed` flags surface failures via durable audit events `AgentTraceBlobPersistenceFailed` / `AgentTraceInlineFallbackFailed`.
- `ExplainabilityTrace` on every `Finding`: five structured fields (`GraphNodeIdsExamined`, `RulesApplied`, `DecisionsTaken`, `AlternativePathsConsidered`, `Notes`). Per `EXPLAINABILITY_TRACE_COVERAGE.md`, most engines achieve 5/5 or 4/5 target coverage. `ExplainabilityTraceCompletenessAnalyzer` is a pure function with property-based FsCheck tests. Ratio reported as OTel histogram `archlucid_explainability_trace_completeness_ratio`.
- Governance: segregation of duties enforced in `GovernanceSegregationRules`; `GovernanceSelfApprovalBlocked` emits a durable audit event; `GovernanceApprovalSlaBreached` covers SLA traceability; pre-commit gate supports block-on-critical and dry-run. `GovernanceWorkflowService` dual-writes (baseline + durable) for the full approval lifecycle.
- `OtelTraceId` persisted on `dbo.Runs`; CLI `trace <runId>` deep-links into Jaeger/Tempo. `IX_AuditEvents_CorrelationId` and `IX_AuditEvents_RunId_OccurredUtc` enable fast per-run audit timelines.
- `ProvenanceGraphDiagram` SVG in operator UI renders the layered chain (snapshots → findings → decisions → manifest → artifacts). `GraphViewer` in buyer-trail mode shows decision disposition panels, finding deep-links, and "Open signed manifest record" navigation.
- `FindingExplainabilityDialog` displays `traceCompletenessRatio` percentage and `missingTraceFields` enumeration — the operator can see exactly which trace fields are unpopulated for a given finding.
- Advisory scan `ResultJson` embeds `traceCompleteness` (by engine, overall ratio, per-field counts) so operators get a per-scan snapshot of trace health.
- TB-036 (correlating `DecisionProvenanceGraph` with `AgentExecutionTrace`) shipped Batch F, 2026-05-26. TB-041 (per-stage completion checkpoint on retry) is Done.

### Gaps (why the score is not higher)

Gaps are concentrated in three themes:

**Theme A — Decision pipeline unification and trace richness (high deficiency)**

- **TB-052** (open): `RuleAuditTracePayload` on authority runs is missing `ContextSnapshotId` / `GraphSnapshotId`. An operator auditing an authority run cannot confirm which ingested snapshot version triggered a specific rule decision — they can confirm the finding's graph node refs but not the snapshot-to-rule binding.
- **TB-054** (open): No unified decision explainability API across the two coexisting pipelines (authority `RuleAuditTracePayload` vs coordinator V2 `DecisionNode`). Enterprise auditors see two lookup patterns, not one endpoint that labels each row with `pipeline: authority | coordinator_v2`.
- **TB-055** (open): `AgentResult.ReasoningTrace` text produced by LLM agents post-run is never propagated to the durable `Finding.ExplainabilityTrace`. The reasoning exists in memory during the run but is discarded; finding inspect shows a blank reasoning block for coordinator agent outputs.

**Theme B — Trace completeness integrity (medium deficiency)**

- **TB-056** (open): The `AlternativePathsConsidered` sentinel `ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote` inflates `ExplainabilityTraceCompletenessAnalyzer` ratios — the analyzer counts the sentinel as "populated." Completeness metrics overstate actual trace quality for rule-based engines that use the sentinel. When a finding engine partially fails mid-scan, there is no manifest-level `FindingEngineFailures` summary visible to the operator.
- **TB-037** (open): `DecisionProvenanceSnapshot` table and `IProvenanceSnapshotRepository.SaveAsync` exist, but the production commit path rebuilds the graph on every read. A recomputed graph is a weaker audit artifact than a persisted point-in-time snapshot: if upstream source data changes, the reconstructed graph may not reflect what was true at commit time.

**Theme C — Operator-visible traces (medium-high deficiency, no previous TB)**

- **Authority pipeline stage timeline not in operator UI.** Authority stage spans (context ingestion, graph, findings, decisions, manifest, artifacts) are OTel-only. An operator investigating a slow or failed run must leave the product and open a separate observability backend. This gap has been noted in quality assessments since April 2026 and has no existing TB. → **TB-250 (new)**.
- **Retrieval indexing has no at-least-once delivery guarantee.** `PROVENANCE_INDEXING.md` explicitly lists "Outbox + worker for post-commit indexing (at-least-once delivery)" in its hardening backlog. If `IRetrievalRunCompletionIndexer` throws after commit, the provenance search index silently lags with no retry job and no operator signal. → **TB-251 (new)**.

---

## Trade-offs

| Decision | Consequence |
|---|---|
| OTel-first tracing design | Excellent for infrastructure monitoring but excludes operators from in-product trace inspection without a separate observability stack |
| Two decision pipelines (authority + coordinator V2) | Allows parallel engine evolution but produces fragmented audit surfaces until TB-054 ships |
| Sentinel `AlternativePathsConsidered` | Avoids noisy placeholders but overstates completeness ratios; confuses tooling that consumes the metric |
| Graph rebuilt on read (TB-037) | Simpler write path but means audit replay is not forensically pinned to commit-time data |
| Retrieval indexing synchronous, inline | Simpler deployment but risks silent post-commit provenance gaps with no retry |

---

## Improvements (prioritized by weighted deficiency signal)

### TRV-01 — Authority pipeline stage timeline in operator UI run detail [TB-250]
**Sub-dimension:** Authority pipeline UI trace (highest-deficiency sub-dim at 40 × 12%)
**Priority:** P1
**Problem:** Stage spans exist only in OTel. No in-product visibility of stage durations or outcomes for operators. First noted in April 2026 quality assessments; never assigned a TB.

**Cursor prompt:**
```
Add an authority pipeline stage timeline to the operator run detail page.

Backend:
1. Add a new DTO StageTimelineSummary { StageName: string, StartedUtc: DateTime?, CompletedUtc: DateTime?,
   OutcomeStatus: string ("succeeded" | "failed" | "skipped"), DurationMs: long? }.
2. Add dbo.RunStageOutcomes (RunId NVARCHAR(64), StageName NVARCHAR(64), StartedUtc DATETIME2,
   CompletedUtc DATETIME2 NULL, OutcomeStatus NVARCHAR(32), INDEX IX_RunStageOutcomes_RunId (RunId)).
3. In AuthorityPipelineStagesExecutor, write a RunStageOutcomes row at stage start
   (OutcomeStatus = "running") and update on completion (OutcomeStatus = "succeeded" | "failed").
4. Expose on GET /v1/architecture/run/{runId}/stage-timeline returning StageTimelineSummary[].
   Alternatively, include as a stageTimeline[] array in the existing run detail response.

Frontend:
5. Add a "Pipeline stages" collapse-by-default section to /reviews/{runId}.
   - For each stage: name, duration (e.g., "1.4 s"), colored StatusTag (succeeded/failed/skipped).
   - When OtelTraceId is present on the run, render a "View in trace viewer" external link.

Tests:
6. Unit: StageTimelineSummary duration computed correctly from two UTC timestamps.
7. Integration: GET .../stage-timeline returns at least one stage for a completed run.
```

**Affected files / projects:**
- New migration `dbo.RunStageOutcomes`
- `ArchLucid.Application/Runs/` (authority pipeline orchestrator)
- `ArchLucid.Api/Controllers/`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/`

**Cross-ref:** TB-052 (authority audit payload), TB-054 (unified decision API — same run detail page).

---

### TRV-02 — Propagate `AgentResult.ReasoningTrace` into durable finding explainability [TB-055]
**Sub-dimension:** Finding-level trace completeness (deficiency 25 × 18%)
**Priority:** P1 — already in backlog; Cursor prompt in TB-055 detail section.

---

### TRV-03 — Unified run decision explainability API [TB-054]
**Sub-dimension:** Decision audit trail (deficiency 22 × 18%)
**Priority:** P1 — already in backlog.

---

### TRV-04 — `RuleAuditTracePayload` snapshot IDs + prompt refs [TB-052]
**Sub-dimension:** Evidence-to-output chain (deficiency 20 × 20%)
**Priority:** P1 — already in backlog.

---

### TRV-05 — Retrieval indexing at-least-once outbox [TB-251]
**Sub-dimension:** Retrieval indexing provenance (deficiency 40 × 4%)
**Priority:** P2
**Problem:** `PROVENANCE_INDEXING.md` explicitly calls this out as hardening backlog. Silent lag after commit; no operator signal.

**Cursor prompt:**
```
Add at-least-once delivery to post-commit retrieval indexing.

1. Create migration: dbo.RetrievalIndexOutbox (OutboxId UNIQUEIDENTIFIER DEFAULT NEWID() PK,
   RunId NVARCHAR(64) NOT NULL, CreatedUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
   ProcessedUtc DATETIME2 NULL, AttemptCount INT NOT NULL DEFAULT 0,
   LastAttemptUtc DATETIME2 NULL, LastError NVARCHAR(2048) NULL).
   Add IX_RetrievalIndexOutbox_Unprocessed filtered index on (CreatedUtc) WHERE ProcessedUtc IS NULL.

2. In ManifestFinalizationService (or the commit orchestrator), after the manifest transaction
   commits, INSERT a row into dbo.RetrievalIndexOutbox for the RunId.

3. Create RetrievalIndexOutboxWorker : BackgroundService that every 30 s:
   - Queries up to 10 rows WHERE ProcessedUtc IS NULL AND AttemptCount < 5, ordered by CreatedUtc.
   - Calls IRetrievalRunCompletionIndexer.IndexRunAsync for each.
   - On success: UPDATE ProcessedUtc = SYSUTCDATETIME().
   - On failure: UPDATE AttemptCount += 1, LastAttemptUtc, LastError = exception.Message[:2048].

4. When AttemptCount reaches 5, emit AuditEventTypes.RetrievalIndexingFailed (new constant).
   Add the constant to AuditEventTypes.cs and AUDIT_COVERAGE_MATRIX.md.

5. Register RetrievalIndexOutboxWorker in ArchLucid.Host.Core DI.

6. Unit tests:
   - Indexer throws → outbox row persisted with AttemptCount = 1 after first worker poll.
   - After 5 failures → RetrievalIndexingFailed audit event emitted.
   - Success → ProcessedUtc set.
```

**Affected files / projects:**
- New migration
- `ArchLucid.Application/Retrieval/` (new worker)
- `ArchLucid.Application/Runs/Finalization/ManifestFinalizationService.cs`
- `ArchLucid.Host.Core/` (DI registration)
- `ArchLucid.Core/Audit/AuditEventTypes.cs`
- `docs/library/AUDIT_COVERAGE_MATRIX.md`
- `docs/runbooks/PROVENANCE_INDEXING.md` (update hardening backlog to mark resolved)

**Cross-ref:** TB-037 (provenance snapshot persistence — same post-commit integrity theme).

---

### TRV-06 — Fix sentinel inflation in completeness analyzer [TB-056]
**Sub-dimension:** Finding-level trace completeness (deficiency 25 × 18%)
**Priority:** P2 — already in backlog; item 4 of TB-056.

---

### TRV-07 — Persist `DecisionProvenanceSnapshot` at commit time [TB-037]
**Sub-dimension:** Evidence-to-output chain (deficiency 20 × 20%)
**Priority:** P2 — already in backlog.

---

## Improvements requiring user input

None. TB-250 and TB-251 are self-contained engineering decisions. All referenced existing TBs (TB-052, TB-054, TB-055, TB-056, TB-037) have no open owner decisions blocking them.

---

## New Cursor-actionable items added to backlog

| ID | Title | Priority | Size |
|---|---|---|---|
| **TB-250** | Authority pipeline stage timeline in operator UI run detail | P1 | M |
| **TB-251** | Retrieval indexing at-least-once outbox | P2 | M |

Items already in backlog (referenced): TB-052, TB-054, TB-055, TB-056, TB-037.

---

## (B) Enterprise procurement realism — informational (weight 0 on headline score)

Enterprise GRC reviewers will ask for a requirements-to-test traceability matrix. `docs/V1_REQUIREMENTS_TEST_TRACEABILITY.md` exists (added April 2026), which partially satisfies this. The remaining procurement friction is the two-pipeline decision architecture (authority vs coordinator V2) — auditors will ask "which pipeline produced this finding?" TB-054 is the engineering answer. This is a `(B)` item with zero weight on `(A)`.
