> **Scope:** Backend performance assessment — evidence-based findings across persistence, API middleware, commit/findings hot paths, and caching. Audience: engineering and platform contributors; not buyer-facing SLA text.
>
> **Assessment date:** 2026-07-02  
> **Related:** [`PERFORMANCE.md`](../library/PERFORMANCE.md), [`PERFORMANCE_BASELINES.md`](../library/PERFORMANCE_BASELINES.md), [`API_PERFORMANCE_TARGETS.md`](../library/API_PERFORMANCE_TARGETS.md), [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md)

# Backend performance assessment (2026-07-02)

## Sponsor summary

ArchLucid’s backend is **well-instrumented and regression-guarded** for pilot-scale usage (k6 CI smokes, named-query allowlists, HybridCache hot-path layer). There is **no sync-over-async blocking** on request paths and **HttpClient** usage is factory-based throughout product code.

The largest **user-perceived latency** opportunities sit in four clusters:

1. **Per-request fixed costs** — trial-seat middleware issues transactional SQL on most authenticated requests.
2. **Commit path CPU** — commit re-runs decisioning and manifest hashing after run create; findings engines run at create, not commit.
3. **Read payload shape** — run detail, findings, and audit paths load and deserialize full JSON blobs per row.
4. **SQL list queries** — run dashboard lists use correlated `EXISTS` subqueries per row; audit/governance hot reads bypass repository cache.

Current in-process commit (~763 ms) uses ~**12%** of the k6 Tier-3 p95 ceiling (6600 ms). Optimizations improve UX and production SQL cost more than merge-gate headroom today.

---

## Evidence envelope (what this assessment supports)

| Signal | Source | Notes |
|--------|--------|-------|
| In-process commit E2E | [`PERFORMANCE_BASELINES.md`](../library/PERFORMANCE_BASELINES.md) | ~763 ms total (simulator + in-memory); commit dominates |
| k6 merge-blocking ceilings | [`API_PERFORMANCE_TARGETS.md`](../library/API_PERFORMANCE_TARGETS.md) | Tier 2 reads ~928 ms p95; Tier 3 commit/create ~6600 ms p95 |
| Pilot load envelope | [`PERFORMANCE.md`](../library/PERFORMANCE.md) | CI smokes are regression bounds, not production RPS SLA |
| Findings vs commit timing | This assessment | ~221 ms “findings” baseline is **create-pipeline** stage telemetry, not inside `CommitRunCoreAsync` |

**Non-claims:** Passing CI k6 does not certify steady-state RPS, multi-region scale, or real-LLM tail latency.

---

## Findings by impact

### High impact

| # | Area | Finding | Primary evidence | Estimated impact |
|---|------|---------|------------------|------------------|
| H1 | Middleware | **Trial-seat reservation** runs transactional SQL (`UPDLOCK`) on most authenticated requests before authorization | `TrialSeatReservationMiddleware.cs:50-55`; `DapperTenantRepository.cs:537-550`; `PipelineExtensions.cs:137-147` | Dominant per-request middleware cost at scale |
| H2 | Persistence reads | **Full JSON blob load + deserialize** on run detail (`ResultJson`, `TraceJson` with read-modify-write patches), findings (`PayloadJson`), audit list/search/export (`DataJson`) | `AgentResultRepository.cs:241-295`; `AgentExecutionTraceRepository.cs:142-287,478-730`; `FindingsSnapshotRelationalRead.cs:28-100`; `HotPathRelationalQueryShapes.cs:172,190` | Core operator read paths; cost scales with payload size and row count |
| H3 | SQL shape | **Run list dashboard** executes **2 correlated `EXISTS` subqueries per row** (HasWarnings, HasGovernanceWarnings) | `HotPathRelationalQueryShapes.cs:25-26`; `SqlRunRepository.cs:276-323` | Up to ~400 subquery executions per page (`take` ≤ 200) |
| H4 | Commit path | **Commit re-runs `IDecisionEngine.DecideAsync`** (manifest rebuild + hash) after create pipeline already decisioned; post-seed topology merge triggers re-work | `AuthorityDrivenArchitectureRunCommitOrchestrator.cs:296-300`; `AgentTopologyProposalGraphMerge.cs:17-88`; `RuleBasedDecisionEngine.cs:47-157` | Likely **100–250+ ms** of ~763 ms in-process commit |
| H5 | Commit path | **`ManifestHashService.ComputeHash` up to 3×** on create→commit pilot path (pipeline, decide, save) | `ManifestHashService.cs:19-94`; `SqlGoldenManifestRepository.cs:93`; `AuthorityPipelineStagesExecutor` stage hash | Tens of ms+ on larger manifests; pure CPU |
| H6 | Caching / scale | **Production default: in-memory HybridCache L1 only** (`Auto` + `ExpectedApiReplicaCount: 1` + empty Redis) | `appsettings.Production.json`; `HotPathCacheProviderResolver.cs:10-24` | Per-replica miss storms and duplicated memory when scaling horizontally without Redis + replica config |
| H7 | Caching gaps | **Audit list/search, governance dashboard, policy-pack list** have no `IHotPathReadCache` decorator and no HTTP `Cache-Control`/ETag | `AuditController.cs`; `GovernanceController.cs:468-485`; `PolicyPacksController.cs:282-288`; `API_PERFORMANCE_TARGETS.md` routes 9–10 | SQL on every request; governance/audit list **not** merge-blocking k6 gated |

### Medium impact

| # | Area | Finding | Primary evidence |
|---|------|---------|------------------|
| M1 | Middleware | API **usage metering** persistence write per `/v*` request when `Metering:Enabled` | `ApiRequestMeteringMiddleware.cs:57-71` |
| M2 | Application | **`RunDetailQueryService`** — 7+ sequential repository calls; no `ConfigureAwait(false)` | `RunDetailQueryService.cs:86-121` |
| M3 | Persistence | **~160+ async persistence files** omit `ConfigureAwait(false)` on hot repos (`SqlRunRepository`, etc.) | Partial adoption vs ~40 files that use it |
| M4 | Cache correctness | **Run list cache keys not evicted on write** — only per-run key removed; list TTL 15s | `CachingRunRepository.cs:18,64,108,225,237`; `HotPathCacheKeys.cs:27-40` |
| M5 | Commit path | **Redundant fetches** at commit: run 2×, findings 2–3×, evidence/results 2×, policy packs N+1 — **Done (TB-588, 2026-07-02)** | `AuthorityDrivenArchitectureRunCommitOrchestrator.cs`; `PreCommitGovernanceGate.cs`; `CommittedEffectiveGovernanceSnapshotCapturer.cs` |
| M6 | Commit path | Independent loads (graph, agent results, findings) are **sequential** — `Task.WhenAll` opportunity | `AuthorityDrivenArchitectureRunCommitOrchestrator.cs:292-299` |
| M7 | Create pipeline | **9+ finding engines awaited sequentially** in `FindingsOrchestrator` | `FindingsOrchestrator.cs:81-142`; `ServiceCollectionExtensions.Decisioning.cs:47-56` |
| M8 | Write batching | Per-row `ExecuteAsync` in loops: usage events, finding rank updates, agent results, SCIM sync, outbox bulk retry | `DapperUsageEventRepository.cs:49-55`; `AgentResultRepository.cs:130-132`; `DapperIntegrationEventOutboxRepository.cs:388-394` |
| M9 | Indexing | **`EngineProvenanceJson`** selected on run lists but omitted from covering index INCLUDE | `HotPathRelationalQueryShapes.cs:22`; `202_HotPathListIndexes.sql:42-65`; `252_Runs_EngineProvenanceJson.sql:6` |
| M10 | Worker | Authority pipeline and integration outbox: **batch 25**, bounded parallel drain, **adaptive idle poll** (1 s base, exponential backoff to 10 s; **Done TB-2122**, 2026-08-09) | `AuthorityPipelineWorkProcessor.cs`; `IntegrationEventOutboxProcessor.cs`; `AdaptiveOutboxDrainLoop.cs` |
| M11 | HttpClient | **Azure DevOps** clients have timeout only — no Polly resilience (unlike ITSM/ARM) | `ServiceCollectionExtensions.SchedulingAndAlerts.cs:310-328` |
| M12 | Serialization | Sync manifest JSON on commit thread; export re-serializes in-memory objects; finalization double-serializes audit + outbox | `AuthorityDrivenArchitectureRunCommitOrchestrator.cs:310-316`; `RunExportPackageBuilder.cs:60-64`; `ManifestFinalizationService.cs:131-153` |
| M13 | Cache hit cost | **Hybrid cache JSON round-trip** on every hit | `HybridHotPathReadCache.cs:58-85` |
| M14 | SQL config | **MARS enabled** in default connection string; **Max Pool Size** not tuned in appsettings | `appsettings.json:55` |
| M15 | Decisioning | **`DefaultGoldenManifestBuilder`** — 11+ `GetByType` full-list scans; rule eval allocates `ToList()` per finding | `DefaultGoldenManifestBuilder.cs:173-599`; `RuleBasedDecisionEngine.cs:71-76` |

### Low impact / positive observations

| Item | Notes |
|------|-------|
| No sync-over-async on request paths | Startup bootstrap only (`ArchLucidPersistenceStartup.cs:44,187,225`) |
| `IHttpClientFactory` everywhere in product hosts | INV-010 architecture test |
| Read-replica routing for run lists, governance, manifests | `SqlStorageProviderRegistrar.cs` |
| Bounded `Task.WhenAll` (governance dashboard 4 queries, post-commit ~4 enqueues) | No unbounded fan-out observed |
| Provenance signing deferred to background projection | Not on commit hot path |
| Rate limiting and OTel metrics mostly low-cardinality | TB-003 named-query allowlist |
| Hot-path indexes present for main list predicates | Migrations `020`, `061`, `202` |

---

## Commit vs create pipeline (clarification)

```mermaid
sequenceDiagram
    participant API
    participant Create as CreateRun (inline pipeline)
    participant Seed as SeedFakeResults
    participant Commit as CommitRunCoreAsync

    API->>Create: POST /v1/architecture/request
    Note over Create: context → graph → findings engines → DecideAsync → artifacts
    API->>Seed: seed-fake-results (evidence + agent results)
    API->>Commit: POST /commit
    Note over Commit: load snapshots → merge topology → DecideAsync again → finalize → V2 nodes
```

Findings engine work (~221 ms in baseline attribution) runs during **create**, not commit. Commit reloads persisted snapshots and re-decisiones because agent topology may change after seed.

---

## Recommended prioritization

| Priority | Action | Backlog | Rationale |
|----------|--------|---------|-----------|
| 1 | Scope or short-circuit **trial-seat middleware** for non-trial tenants | **TB-574** | Highest fixed per-request tax |
| 2 | **Reuse or incrementally update** pipeline manifest on commit when only topology merge differs; **pass hash** from decide to save | **TB-575** | Largest commit CPU win |
| 3 | Replace run-list **correlated EXISTS** with join aggregates or persisted flags | **TB-576** | Highest dashboard SQL cost |
| 4 | **Project or lazy-load** JSON columns on run detail / audit export paths | **TB-577** | Payload cost scales with data |
| 5 | **Evict run list cache keys** (or scope revision bump) on run writes | **TB-578** | Correctness + perceived freshness |
| 6 | Add **`Task.WhenAll`** for independent commit loads and parallel finding engines (preserve failure semantics) | **TB-579** | Low-effort wins |
| 7 | Wire **Redis L2 + replica count** before horizontal scale-out (**TB-094** infra done) | **TB-580** | Avoid miss storms |
| 8 | Extend **HotPathCache** or short-TTL cache to governance dashboard / audit search | **TB-581** | Documented coverage gaps |

Additional medium/low items: **TB-582**–**TB-593** — **TB-582**–**TB-593** **Done** (2026-07-03) — manifest CPU (`FindingsSnapshotTypeIndex`), hybrid-cache typed L2 slots, SQL pool/MARS normalizer, k6 governance/audit scenarios, findings snapshot read cache.

---

## Backlog tracking

| ID range | Scope |
|----------|--------|
| **TB-574**–**TB-593** | **Done** (2026-07-03) — all recommendations from this assessment |
| **TB-018** | **Done** (2026-07-03) — warm tenant catalogs + low-depth warning |
| **TB-560**–**TB-573** | **TB-566**–**TB-571** **Done** (2026-07-03); remainder see [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) |

---

## Related backlog (do not duplicate)

| ID | Status | Relevance |
|----|--------|-----------|
| **TB-003** | Done | Named-query p95 allowlist + `archlucid_query_p95_ms` |
| **TB-094** | Done | Terraform Redis for hot-path cache — runtime wiring is **TB-580** |
| **TB-155** | Done | ROI cache vs live governance KPIs |
| **TB-319** | Done | Pilot-critical performance evidence script |
| **TB-574**–**TB-593** | **Done** (2026-07-03) | Backend performance assessment |
| **TB-018** | **Done** (2026-07-03) | Warm tenant catalogs (signup latency) |
| **TB-560–573** | Partial | Next.js operator-shell performance — **TB-566**–**TB-571** **Done** (2026-07-03) |

---

## Investigation method

Code review across `ArchLucid.Persistence`, `ArchLucid.Api`, `ArchLucid.Application`, `ArchLucid.Decisioning`, `ArchLucid.KnowledgeGraph`, `ArchLucid.Worker`, and `ArchLucid.Host.*`, cross-referenced with performance library docs and TECH_BACKLOG. Findings cite file:line evidence only; severities reflect hot-path involvement and pilot-scale envelope in [`PERFORMANCE.md`](../library/PERFORMANCE.md).
