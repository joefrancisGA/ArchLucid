> **Scope:** Contributor-reference — Engineering backlog for retrieval-augmented generation (RAG) quality improvements — extends existing `ArchLucid.Retrieval` + `AskService` infrastructure; not procurement copy or a product roadmap commitment.

# RAG quality — technical backlog

**Audience:** Engineering, assessment owners, coding agents scheduling `(A)` improvements.

**Purpose:** Turn the RAG quality plan into **schedulable engineering tasks** by release phase. **V1 items** belong in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) (**TB-021**) so weighted readiness assessments can pull them into sprint planning without re-deriving scope.

**Product layers:** V1 corpus work improves **Pilot** faithfulness (agent findings, cost citations) and **Operate** Ask/explanation quality. V1.1 items align with MCP, planning materialization, and multi-cloud analysis already pinned in [`V1_DEFERRED.md`](V1_DEFERRED.md).

**Normative constraints (do not regress):**

- **Deterministic decisioning stays deterministic** — RAG enriches narrative and citations; `RuleBasedDecisionEngine` rule fire is unchanged.
- **Manifest hash / replay verify** — retrieved chunks are **prompt context only** unless snapshotted with content hashes for verify mode (see **RAG-V1-000**).
- **Tenant isolation** — tenant-bound corpora require `TenantId` / `WorkspaceId` / `ProjectId` filters on index **and** query (defence in depth). Cross-tenant text retrieval is **forbidden** outside [ADR 0031](../architecture/adrs/0031-cross-tenant-pattern-library.md) k-anonymous aggregates (not embedding-RAG).
- **ADR 0004** — indexing enqueue stays inside the authority-commit SQL transaction where supported.
- **ADR 0005** — embedding and completion calls stay inside the existing quota / circuit-breaker / cache pipeline.

---

## Already in codebase (baseline — not backlog)

| Area | Location | Notes |
|------|----------|-------|
| Embedding + vector index | `ArchLucid.Retrieval/` — `AzureOpenAiEmbeddingService`, `AzureAiSearchVectorIndex`, `InMemoryVectorIndex` | Config: `Retrieval:VectorIndex`, `AzureOpenAI:Embedding*` |
| Indexing + outbox | `RetrievalIndexingService`, `RetrievalRunCompletionIndexer`, ADR 0004 | Post-commit indexing path |
| Ask retrieval | `AskService` — `IRetrievalQueryService.SearchAsync`, TopK=8, conversation re-index | Fail-open on retrieval errors |
| Token budget | `TokenAwareContextBudget` | Structured context truncation |
| Agent grounding index | `AgentEvidenceGroundingIndex` | Evaluation / trace path |
| Policy pack (content) | `templates/policy-packs/**`, `docs/templates/policy-packs/**` | **Not yet indexed** as RAG corpus |

---

## Phase map

| Phase | Horizon | Backlog home | Assessment hook |
|-------|---------|--------------|-----------------|
| **V1 foundation** | V1 GA+ quality | **TB-021** + this file §V1 | `(A)` AI/Agent Readiness, Faithfulness, Time-to-Value |
| **V1.1 expansion** | V1.1 window | [`V1_DEFERRED.md`](V1_DEFERRED.md) §6q | `(B)` until promoted; not `(A)` V1 penalty |
| **V2 advanced** | V2 backlog | [`V1_DEFERRED.md`](V1_DEFERRED.md) §6q | Explicitly out of V1/V1.1 contract |

---

## V1 — foundation (TB-021)

**Objective:** Raise **faithfulness** and **citation density** using existing retrieval infrastructure — no new vector store, no agentic multi-hop retrieval.

**Recommended implementation order:** **RAG-V1-000** (shared seam) → **RAG-V1-001** → **RAG-V1-003** → **RAG-V1-002** → **RAG-V1-004**. **RAG-V1-005** (citation faithfulness eval) ships alongside or immediately after **RAG-V1-001**. **Retrieval correctness & drift (2026-05-26 audit):** **RAG-V1-010** (tenancy) → **RAG-V1-007** (embedding drift) → **RAG-V1-011** (IR eval harness) → **RAG-V1-008** (index freshness) → **RAG-V1-009** (chunking versioning).

**First implementation slice (design approved 2026-05-23):** [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) — **RAG-V1-000 partial** (`CorpusKind`, `ICorpusSource`, platform-sentinel search) + **RAG-V1-001** (`PolicyPackCorpusIndexer`, `ComplianceAgentHandler` wiring). Pick up as one PR under **TB-021**.

### RAG-V1-000 — Shared corpus seam + grounding trace

| Field | Value |
|-------|-------|
| **Priority** | P0 — blocks other V1 RAG tasks |
| **Size** | M (~2–3 eng days) |
| **Quality axis** | Reliability, AI/Agent Readiness |

**Deliverables**

1. `CorpusKind` enum on `RetrievalDocument` (`PolicyPack`, `TenantManifest`, `AzureRetailPrice`, `PlatformDoc`, `ReferenceArchitecture`, `Conversation` — default `Conversation` for back-compat).
2. `ICorpusSource` interface — one implementation file per corpus kind; each owns `BuildDocuments(...)` + refresh trigger documentation.
3. `IRetrievalCitationFormatter` — uniform citation shape `[corpus]/[id]@[version]` for Ask metadata, finding narratives, DOCX export hooks.
4. `dbo.RetrievalGroundingTrace` (+ DbUp migration + consolidated `Scripts/ArchLucid.sql` update): `runId`, `agentName`, `retrievedChunkIds`, `tokensIn`, `tokensOut`, `citationCoverage` — supports eval and support bundles.
5. Architecture test or analyzer rule: tenant-bound `RetrievalQuery` must include tenant scope (fail build on regression).

**Replay note:** Document in runbook that retrieval hits are **excluded from manifest canonical fingerprint** unless a future ADR promotes snapshotting retrieved chunk content hashes into the committed chain.

**Implementation design (partial — first PR):** [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) §3–§4, §7 (citation formatter + `RetrievalGroundingTrace` deferred to follow-on PR).

**Status (2026-05-25):** **Shipped** — tenant-assigned pack query filter, `IRetrievalCitationFormatter`, `dbo.RetrievalGroundingTrace`, ComplianceAgentHandler grounding trace, architecture test for tenant-bound `RetrievalQuery`.

**Refs:** ADR 0004, ADR 0005; [`DATA_CONSISTENCY_MATRIX.md`](DATA_CONSISTENCY_MATRIX.md).

---

### RAG-V1-001 — Policy-pack rule-text corpus

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Size** | S–M (~1–2 eng days after RAG-V1-000) |
| **Quality axis** | Faithfulness (compliance findings) |

**What**

- Index natural-language rule text + rationale from `templates/policy-packs/**` and `docs/templates/policy-packs/**` (versioned with pack id).
- Refresh on policy-pack publish / CI doc change — **not** per run.
- Wire retrieval into `ComplianceAgentHandler` (and optionally governance-block explainer paths) **before** LLM completion.
- When no rule hit: attach `groundingMissing=true` on typed payload — **do not fail the run**.

**Acceptance**

- Golden-corpus or unit test: known compliance scenario produces finding `reasoningSummary` quoting pack control text.
- Indexed chunks carry `CorpusKind=PolicyPack` and pack version metadata.

**Implementation design:** [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) §5–§9 (full file list, DI, tests, compliance handler).

**Refs:** [`PRE_COMMIT_GOVERNANCE_GATE.md`](PRE_COMMIT_GOVERNANCE_GATE.md); [`POLICY_PACK_CONTENT_BACKLOG.md`](POLICY_PACK_CONTENT_BACKLOG.md) (content ops, separate from indexer).

---

### RAG-V1-002 — Tenant prior-manifest corpus (per-decision / per-finding chunks)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Size** | M (~3–4 eng days) |
| **Quality axis** | Cross-run consistency, Stickiness |

**What**

- Extend `RetrievalDocumentBuilder` / `RetrievalRunCompletionIndexer` to emit chunks for each committed **decision** and **finding** (not whole-manifest blobs only).
- Tag chunks with `decisionId` / `findingId` for Ask and agent citation back-links.
- Index via existing outbox on authority commit (ADR 0004).
- Scope filters: mandatory tenant/workspace/project on index and query.

**Acceptance**

- Second run on similar brief retrieves prior decision chunk in Ask top-K.
- No cross-tenant leakage in integration test with two tenant catalogs.

**Status (2026-05-25):** **Shipped** — `ListPriorCommittedForRetrievalAsync`, `PriorManifestRetrievalOptions.MaxPriorManifestsPerIndex`, cross-run indexing in `RetrievalRunCompletionIndexer`.

---

### RAG-V1-003 — Azure Retail Prices structured retrieval (non-embedding)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Size** | S (~1–2 eng days) |
| **Quality axis** | Faithfulness (cost), Proof-of-ROI |

**What**

- Purpose-built lookup by `(ServiceName, MeterName, Region, Sku)` using `AzureRetailPricesCatalogClient` — **no embeddings**.
- Cost agent (and cost-related finding narrative) must retrieve ≥1 price row before quoting USD figures, or mark estimate as non-cited.
- Propagate citation contract from [`V1_SCOPE.md`](V1_SCOPE.md) §2.16 — `manifest.json` `collectionTimestamp` + Retail row when ZIP-sourced.

**Acceptance**

- Unit test: cost agent prompt includes retrieved SKU row when catalog hit exists.
- No false "Azure Retail" attribution when `CloudProvider` is not Azure (guard until §2.19 multi-cloud ships).

**Refs:** [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) item 3 (evidence bundle wiring).

**Status (2026-05-25):** **Shipped** (Improvement **#8**) — `CostRetailGroundingBuilder`, `AzureRetailPricesCatalogStructuredLookup`, `AgentRuntime.CostAgentHandler`, catalog-backed DI registration.

---

### RAG-V1-004 — Platform docs corpus (ADR / library) for Ask + Explanation

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Size** | S (~1 eng day) |
| **Quality axis** | Usability, Supportability |

**What**

- Index allow-listed platform docs: `docs/architecture/adrs/**`, selected `docs/library/**` contributor reference.
- **Deny list:** `docs/go-to-market/**`, `docs/security/pen-test-summaries/**`, raw customer data paths.
- Partition as `tenantId = platform` (or dedicated index partition) so RLS tenant filters do not hide platform chunks incorrectly.
- CI refresh on doc merge to main.

**Acceptance**

- Ask integration test: question about a documented ADR returns chunk citing ADR id in retrieved evidence block.

**Status (2026-05-25):** **Shipped** (Improvement **#9**) — `PlatformDocCorpusIndexer` allow-listed library paths, `AskRetrievalIntentDetector.DetectPlatformDocIntent`, Ask `IncludePlatformCorpora` wiring.

---

### RAG-V1-005 — Faithfulness eval harness for RAG (output-side citation coverage)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Size** | M (~2 eng days) |
| **Quality axis** | AI/Agent Readiness |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-021** |

**What**

- Extend `tests/eval-corpus/` or golden-corpus with **citation-required** scenarios (keyword + `evidenceRefs` / pack id patterns).
- Score `RetrievalGroundingTrace.citationCoverage` per agent in simulator + optional real-mode path (align with **TB-007** Gap C).
- Dashboard or CI artifact: `% findings with pack citation` trend.

**Scope boundary (2026-05-26 audit):** This item measures **output-side citation faithfulness** (`RetrievalFaithfulnessEvaluator` — SourceId substring in agent text). It does **not** measure retrieval **recall@k**, **precision@k**, or **MRR** — see **RAG-V1-011**.

**Acceptance**

- CI job fails (or `--enforce` warn) when citation coverage drops below configured floor on templates-pack scenarios.

**Refs:** **TB-007**; [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md).

---

### RAG-V1-006 — `RetrievalGroundingTrace` forensic enrichment

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Size** | S–M (~1–2 eng days) |
| **Quality axis** | Supportability, forensic replay |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-038** |

**Context (2026-05-26):** **RAG-V1-000** shipped `dbo.RetrievalGroundingTrace` with `RetrievedChunkIds`, token counts, and `CitationCoverage` for **Compliance** (`ComplianceAgentHandler.AppendGroundingTraceAsync`). Replay audit found insufficient fields to reconstruct retrieval inputs for a single agent task.

**What**

1. Extend `RetrievalGroundingTraceInsert` + DbUp / `Scripts/ArchLucid.sql`: `QueryText` (truncated, e.g. 4K), `TopK`, `CorpusKind`, optional bounded `ScoresJson` and `DocumentIdsJson`.
2. Optional `AgentExecutionTraceId` (or `TraceId`) FK/correlation when trace row exists.
3. Write grounding trace from every handler that invokes `IRetrievalQueryService` (Topology, Cost where applicable — not only Compliance).
4. Fail-open unchanged — empty trace + warning on retrieval error; never fail run commit.

**Acceptance**

- Integration test: Compliance run persists query text + chunk IDs + trace correlation.
- Architecture test or handler audit: no agent using retrieval skips grounding writer after this ships.

**Status (2026-05-28):** **Shipped** — forensic columns on `dbo.RetrievalGroundingTrace`, builder enrichment, Compliance grounding writer, architecture guard for retrieval-using agent handlers.

**Replay note:** Enriched trace rows still do **not** put retrieved chunk text into manifest canonical fingerprint unless a future ADR promotes content-hash snapshotting (**RAG-V1-000** replay note stands).

**Refs:** Replay / provenance completeness audit (2026-05-26); [`AGENT_TRACE_FORENSICS.md`](AGENT_TRACE_FORENSICS.md).

---

### RAG-V1-007 — Embedding model identity and drift guard

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Size** | S–M (~1–2 eng days) |
| **Quality axis** | Reliability, AI/Agent Readiness |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-045** |

**Context (2026-05-26):** Retrieval correctness audit — `RetrievalChunk` stores `float[] Embedding` only; deployment name is config + telemetry only. `InMemoryVectorIndex.Cosine()` returns `0` on dimension mismatch (e.g. `FakeEmbeddingService` 32-dim vs Azure 1536-dim) with no alert. ADR 0036 reserves `embedding:model` / `dim` / `hash` on graph nodes — not on retrieval chunks.

**What**

1. Add `EmbeddingModelId` (deployment name or stable alias) and `EmbeddingDimension` to `RetrievalChunk` (and index upsert path).
2. At query time: reject or filter chunks whose dimension ≠ query embedding dimension; emit warning metric (`archlucid.retrieval.embedding_dimension_mismatch_total`).
3. At host startup (or first index write): compare active config deployment + dimension against index metadata; enqueue **full re-embed** for affected corpora when model id or dimension changes.
4. Document operator runbook: model swap requires re-index (until automatic re-embed ships).

**Acceptance**

- Unit test: cosine path logs/emits metric when vector lengths differ.
- Integration test: after simulated deployment change, startup triggers re-index or fails closed with actionable error (not silent zero scores).
- No mixed-dimension chunks served in top-K for tenant-bound queries.

**Status (2026-05-28):** **Shipped** — `EmbeddingModelId` / `EmbeddingDimension` on chunks, dimension mismatch metric, startup drift validator.

**Refs:** [ADR 0036](../architecture/adrs/0036-graph-rag-embedding-strategy.md); `AzureOpenAiEmbeddingClient.cs`; `RetrievalChunk.cs`.

---

### RAG-V1-008 — Index freshness, ContentHash skip, and indexer observability

| Field | Value |
|-------|-------|
| **Priority** | P1 (ContentHash skip: **P0** within this item) |
| **Size** | S–M (~1–2 eng days) |
| **Quality axis** | Reliability, Supportability |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-046** |

**Context (2026-05-26):** `RetrievalDocument.ContentHash` is set for dedupe hints but **never read** in `RetrievalIndexingService`. Startup indexers are fail-open; outbox failure leaves stale vectors with no operator signal. `InMemoryVectorIndex` trims at 10_000 chunks (capacity, not staleness).

**What**

1. **P0:** In `RetrievalIndexingService`, skip re-chunk/re-embed when document `ContentHash` unchanged and chunk metadata matches (coordinate with **RAG-V1-009** fingerprint).
2. Persist **last-indexed-at** per corpus kind (SQL metadata table or lightweight sidecar — single DDL file per DB rule).
3. Startup corpus indexers: log + increment failure metric on exception; optional health check endpoint field `retrievalIndexFreshness`.
4. **P2 (optional):** Scheduled re-index job with configurable max-age per `CorpusKind`.

**Acceptance**

- Unit test: unchanged `ContentHash` → no embedding API calls on second `IndexDocumentsAsync`.
- Integration test: simulated outbox stall surfaces stale freshness in health/readiness probe.
- Startup indexer failure increments `archlucid.retrieval.indexer_failure_total` (or equivalent) — not swallowed silently.

**Status (2026-05-28):** **Shipped** — ContentHash skip, chunking fingerprint coordination, per-corpus freshness summaries, startup indexer failure metric, `retrieval_index_freshness` health check.

**Refs:** `RetrievalIndexingService.cs`; `ExemplarCorpusStartupIndexerHostedService.cs`; ADR 0004 outbox.

---

### RAG-V1-009 — Chunking strategy fingerprint and invalidation

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Size** | S (~1 eng day) |
| **Quality axis** | Reliability, AI/Agent Readiness |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-047** |

**Context (2026-05-26):** Chunk sizes/overlap are method defaults in `SimpleTextChunker` (1200/150), `PolicyPackChunker` (900/120), `PriorManifestChunker` (800/100). No strategy version on `RetrievalChunk`; code-default changes produce mixed-generation indexes silently.

**What**

1. Compute stable **chunking fingerprint** (hash of strategy name + maxChars + overlap + corpus kind) at index time; store on each `RetrievalChunk`.
2. Move defaults from method signatures to `IOptions<ChunkingOptions>` (or per-corpus options) so changes are config-visible.
3. When fingerprint differs from stored chunks for a document, delete stale chunk IDs for that document before upsert (full document invalidation).
4. Query-time guard (optional): exclude chunks whose fingerprint ≠ active config fingerprint.

**Acceptance**

- Unit test: changing `ChunkingOptions` invalidates and re-indexes document; old chunk IDs not returned in search.
- Architecture test or doc: chunker defaults are not silent magic numbers in method signatures.

**Status (2026-05-28):** **Shipped** — chunking fingerprint on chunks, invalidation on fingerprint change, options-backed chunkers.

**Refs:** `RetrievalIndexingService.SelectChunker()`; `Chunking/*.cs`.

---

### RAG-V1-010 — Tenancy isolation hardening (retrieval index + query)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Size** | S (~1 eng day) |
| **Quality axis** | Security, Reliability |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-048** |

**Context (2026-05-26):** `InMemoryVectorIndex` enforces tenant/workspace/project match and has anti-leak tests. **Gap:** when `AllowedPolicyPackRulePackIds == null`, all policy-pack chunks match (`return true`). Direct `IVectorIndex` callers bypass `RetrievalQueryService` assignment resolver. Azure Search path has no in-repo client implementation to audit `$filter` on `tenantId`.

**What**

1. **P0:** Change `InMemoryVectorIndex.MatchesAssignedPolicyPack`: `AllowedPolicyPackRulePackIds == null` → **exclude all** `CorpusKind.PolicyPack` chunks (safe default).
2. **P0:** Integration test: direct `IVectorIndex.SearchAsync` with null assignment list returns no policy-pack hits.
3. **P1:** When `AzureAiSearchVectorIndex` client is implemented, require OData `$filter` including tenant scope on every query; add integration test asserting filter clause.
4. **P2:** Upsert-time validation — indexed chunk `TenantId` must match authorized indexing context (fail index write on mismatch).

**Acceptance**

- Existing `SearchAsync_TenantScopedPriorManifest_DoesNotLeakOtherTenant` passes; new test locks null-assignment policy-pack behavior.
- Architecture test remains green for tenant-bound `RetrievalQuery` at product call sites.

**Refs:** `InMemoryVectorIndex.cs`; `RetrievalQueryService.cs`; `TenantBoundRetrievalQueryArchitectureTests.cs`; ADR 0031 (cross-tenant aggregates ≠ embedding-RAG).

---

### RAG-V1-011 — Retrieval IR eval harness (recall@k, MRR, golden dataset) — **Done (Batch E, 2026-05-26)**

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Size** | M (~2–3 eng days) |
| **Quality axis** | AI/Agent Readiness, Correctness |
| **Scheduling** | [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-049** — shipped |

**Context (2026-05-26):** No recall@k, precision@k, MRR, or NDCG in codebase. `RetrievalFaithfulnessEvaluator` and `eval_agent_faithfulness.py` measure **citation coverage in agent output**, not whether the **correct chunks** were retrieved. Chunking, reranker, or embedding changes can degrade retrieval with no CI gate.

**What**

1. Golden dataset: `tests/eval-datasets/retrieval-golden/cases.json` — 30–50 rows of `(query, tenantScope, corpusKind, expectedChunkIds[])` covering PolicyPack, PriorManifest, PlatformDoc.
2. Harness script: `scripts/ci/eval_retrieval_ir.py` (mirror `eval_agent_corpus.py`) — index fixture corpora, run `IRetrievalQueryService.SearchAsync`, compute **recall@5**, **MRR**; optional **precision@3**.
3. CI job: fail (or `--enforce` warn) when recall@5 or MRR drops below configured floor vs baseline artifact.
4. Pre-merge gate doc: run harness after chunking, reranking, or embedding deployment changes.

**Acceptance**

- CI produces artifact with per-corpus recall@5 and MRR; regression on seeded fixture fails build when `--enforce`.
- Documented distinction from **RAG-V1-005** (output citation faithfulness) in [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md).

**P2 follow-on:** NDCG@10 for policy-pack ordering-sensitive scenarios.

**Refs:** **RAG-V1-005**; `RetrievalFaithfulnessEvaluator.cs`; `RetrievalQuerySmokeIntegrationTests.cs`.

---

## V1.1 — expansion ([`V1_DEFERRED.md`](V1_DEFERRED.md) §6q)

**Not `(A)` V1 GA requirements.** Schedule after V1 foundation measurably lifts faithfulness metrics.

| ID | Title | Size | Notes |
|----|-------|------|-------|
| **RAG-V1.1-001** | Reference-architecture exemplar retrieval | M | Index `templates/reference-architectures/**`, `templates/starter-proof-packs/**`; search by request fingerprint; **style prior only** — never in manifest hash |
| **RAG-V1.1-002** | MCP read-only retrieval tools (3 of 7) | M | `policy-pack-search`, `prior-decision-search`, `price-row-lookup` per [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) §5.1 |
| **RAG-V1.1-003** | Pilot-feedback retrieval for planning materialize | S–M | `POST /v1/learning/planning/materialize` — citable themes from ranked opportunities ([`PRODUCT_LEARNING.md`](PRODUCT_LEARNING.md)) |
| **RAG-V1.1-004** | Cross-tenant pattern library UI (ADR 0031) | L | Nightly k-anon aggregates — **not** embedding-RAG; coordinated with PatternInsights API |

---

## V2 — advanced ([`V1_DEFERRED.md`](V1_DEFERRED.md) §6q)

| ID | Title | Trigger to reconsider |
|----|-------|------------------------|
| **RAG-V2-001** | Graph-RAG over knowledge / provenance graph | Schema stable as of 2026-05-26 (ADR 0036); promote to V2 implementation only after V1 RAG foundation + reranker + faithfulness harness fail to hit faithfulness floor on two consecutive golden-cohort weeks |
| **RAG-V2-002** | Agentic retrieval (HyDE, query rewrite, cross-encoder rerank) | V1 eval shows single-hop retrieval insufficient; budget for extra LLM hops approved |
| **RAG-V2-003** | Online fine-tuning on accepted manifests | Explicit DPA + owner ADR; separate from retrieval |

### Reranking — V1 decision (2026-05-26)

- **Primary:** Azure AI Search semantic ranker via `IRetrievalReranker` / `AzureAiSearchSemanticRetrievalReranker` (max 50 candidates; disabled in Development via `Retrieval:Reranking:Enabled`).
- **Fallback (dev):** Lexical overlap when search is not configured.
- **Contingency:** Cohere Rerank-v3.5 via Azure AI Foundry only if golden-cohort citation precision stays below 0.80 for two consecutive weeks after semantic ranker ships.
- **Telemetry:** `archlucid.rerank.latency_ms` histogram.

---

## Security · scalability · reliability · cost

| Concern | V1 posture |
|---------|------------|
| **Security** | Azure OpenAI embeddings + Azure AI Search only; private endpoints; corpus allow/deny lists; no PII free-text in cross-tenant paths; **RAG-V1-010** closes policy-pack null-assignment bypass |
| **Scalability** | Index on publish/commit cadence; query O(TopK), TopK≤8 default; embedding cache keyed on chunk hash; **RAG-V1-008** ContentHash skip reduces redundant embed calls |
| **Reliability** | Retrieval fail-open (match `AskService`); log warning + empty grounding trace — never fail commit; **RAG-V1-007** / **RAG-V1-008** add drift + freshness signals without failing run commit |
| **Cost** | `LlmMonthlyTenantDollarBudgetTracker` gates embedding spend; do not embed full artifact bundles or entire Retail catalog; ContentHash skip (**RAG-V1-008**) avoids re-embed on unchanged docs |

---

## Related documents

| Doc | Role |
|-----|------|
| [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) | **TB-021** first slice — `CorpusKind` + `PolicyPackCorpusIndexer` (approved 2026-05-23) |
| [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-021** | V1 scheduling entry for assessments |
| [`CONSOLIDATED_PLANNING_BACKLOG.md`](../CONSOLIDATED_PLANNING_BACKLOG.md) **CPB-T21**, **CPB-D18–D20** | Owner planning spine |
| [`AI_LEVERAGE_ROADMAP.md`](AI_LEVERAGE_ROADMAP.md) | Complementary operator-facing AI items (#3 Ask finding, #11 compare narrative) |
| [`authoring-prompts/PACK_CONTEXTS.md`](authoring-prompts/PACK_CONTEXTS.md) **AI-05** | RAG Architecture Governance policy-pack thematic mapping |
| [ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md) | Transactional indexing |
| [ADR 0031](../architecture/adrs/0031-cross-tenant-pattern-library.md) | Cross-tenant aggregates (not embedding-RAG) |

**Change control:** When V1 RAG boundaries shift, update **this file** and **TB-021** together; promote V1.1 items to [`V1_SCOPE.md`](V1_SCOPE.md) only after owner decision (same pattern as other deferred inventory).
