> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Azure AI Search vs SQL — dual-truth, divergence, rebuild, review window

**Audience:** Engineering, SRE, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract — eng/GTM backlog IDs pending re-land after ledger rewind (do not claim **M-277**; that ID is crash-recovery **M-277** / **TB-1523**).

**Verdict (one line):** SQL (runs / golden manifests / sealed evidence) is the system of record; Azure AI Search is an **eventually consistent projection** via transactional outbox — **nothing compares Search document sets to SQL**, so “divergence” is inferred only from outbox lag/DLQ and weak process-local RAG-health signals; “full rebuild” is ops cutover / RC6 wake-up / document-scoped delete+upsert, **not** a dual-index blue-green swap; during lag or rebuild, **reviews remain authoritative in SQL** while Ask/Search may quietly miss recent commits (no dedicated rebuild banner on review detail).

---

## 1. Roles (not two equal sources of truth)

| Plane | Role | Consistency |
|-------|------|-------------|
| **Azure SQL** | Authority: runs, golden manifests, findings, sealed evidence, audit | Strong post-commit for authority rows |
| **Azure AI Search** | Retrieval projection: chunks for Ask / Search / Graph-RAG seeds | **Eventual** — enqueue in finalize UoW; worker indexes later ([ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md), [`DATA_CONSISTENCY_MATRIX.md`](DATA_CONSISTENCY_MATRIX.md)) |

Safe pin: Search is a **second store**, not a second **source of truth**. Commit success does **not** mean indexed.

---

## 2. What detects divergence today?

| Signal | What it proves | What it does **not** prove |
|--------|----------------|----------------------------|
| Retrieval indexing outbox pending / oldest age / DLQ | SQL handoff lag / poison rows | A specific Search doc missing or extra vs SQL |
| `OperatorOutboxDiagnosticsCard` (“Retrieval indexing pending”) | Ops lag visibility | Reviewer-facing parity |
| Admin RAG health (`GET /v1/admin/rag-health`) | Process-local catalog freshness (`InMemoryRetrievalDocumentIndexCatalog`; `IsStale` ≈ >24h) | Azure Search ↔ SQL document parity; multi-replica truth |
| `retrieval_index_freshness` / `vector_store` health | Empty-index / probe availability (weak) | Dual-store reconciliation |
| `DataConsistencyOrphanProbeHostedService` | SQL orphans (incl. grounding traces) | Search residuals |
| Embedding drift startup guard | Model/dim mismatch vs in-memory metadata | Live Search vs SQL content drift |

**Gap:** No scheduled job that reconciles committed SQL evidence keys/hashes to Azure AI Search `documentId`/`chunkId` sets.

---

## 3. Full-rebuild story (what exists)

| Mode | Mechanism | Zero-downtime dual-index? |
|------|-----------|---------------------------|
| **Steady-state** | Outbox → `RetrievalRunCompletionIndexer` → `RetrievalIndexingService` upsert | N/A |
| **Document invalidation** | Chunking fingerprint / content-hash change → `RemoveChunksForDocumentAsync` then upsert | **No** — brief missing-doc window possible under concurrent search |
| **Schema / external reconcile** | Create new index, reindex from ArchLucid, cut over `Retrieval:AzureSearch:IndexName` ([`AZURE_AI_SEARCH_INDEX_CONTRACT.md`](AZURE_AI_SEARCH_INDEX_CONTRACT.md)) | **No** alias/swap protocol shipped |
| **RC6 ephemeral** | Stash may delete Search service; wake rebuilds from system of record ([`RC6_RAG_EPHEMERAL_SEARCH.md`](../runbooks/RC6_RAG_EPHEMERAL_SEARCH.md)) | Dev/ops only; hard empty window |
| **Embedding model change** | Startup fail-fast; ops must clear/reindex — **no** product auto full-re-embed job | Manual |
| **Platform corpora** | Startup corpus indexers (docs/packs/exemplars) | Not tenant review corpus full rebuild |
| **Tenant hard purge** | SQL purge path; **Search not in** `TenantDeletionService` ([`GDPR_ERASURE_VS_APPEND_ONLY_MAP.md`](GDPR_ERASURE_VS_APPEND_ONLY_MAP.md)) | Residual index risk |

**Not shipped:** Admin “rebuild entire Search from SQL” API; scheduled max-age reindex (RAG-V1-008 remainder); dual-index blue-green alias.

---

## 4. What a review sees during the rebuild / lag window

| Surface | During outbox lag / empty / rebuilding index |
|---------|-----------------------------------------------|
| **Review / package detail (SQL)** | Intact — sealed commit does not wait on Search; **no** “indexing in progress” banner on review detail |
| **Ask** | Empty hits → continues with structured SQL context (not always labeled degraded); **exception** path → `RetrievalDegraded` + SQL fallback banner |
| **Search UI** | Empty → “ensure … committed review evidence indexed”; no rebuild-specific copy |
| **Graph-RAG** | Expands only if seed hits exist; empty index → silent fewer neighbors |
| **Ops** | Outbox pending card / metrics may show lag; RAG health table is **not** SQL parity |

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Azure AI Search is a second source of truth beside SQL” | Search is an eventual projection of SQL authority |
| “We detect index↔DB divergence” | We detect **outbox lag/DLQ** and weak catalog freshness — not dual-store reconcile |
| “Full rebuild is zero-downtime dual-index swap” | Cutover = new index name / RC6 recreate / per-doc delete+upsert |
| “RAG health proves Search matches SQL” | Process-local catalog; not Azure Search document audit |
| “Commit success means Ask/Search see the package” | Commit enqueues indexing; delivery lags (**TB-1011** / **M-162** / **M-164**) |
| “Tenant delete clears Search” | Not wired today (**TB-1470**) |

---

## 6. Related owners

| ID | Role |
|----|------|
| Done **TB-251** | Retrieval indexing outbox + worker |
| Done **TB-045**–**TB-047** | Drift guard / freshness / chunk invalidation |
| Done **TB-071** / **TB-604** | Search tenancy filter + upsert scope |
| Open **TB-1001** / **M-152** | Retrieval tenancy guarantee (shared index + `$filter`) |
| Open **TB-1011** / **M-162** | Finalize vs outbox; committed ≠ indexed |
| Open **TB-1013** / **M-164** | Read-after-write / Ask-Search lag disclosure |
| Open **TB-1471** / **M-265** | GDPR / Search residual honesty CI |
| **TB-1514** / **M-277** | This dual-truth / rebuild / review-window map |

---

## 7. Optional engineering follow-ons (not required to close honesty pin)

1. Scheduled SQL↔Search key/hash reconciliation probe + alert.
2. Reviewer-visible “retrieval indexing pending” on package detail when outbox row open for that run.
3. Production rebuild runbook with explicit empty-window / cutover checklist (alias optional later).
4. Wire tenant purge → scoped Search delete (**TB-1470** path).
5. Refresh [`PROVENANCE_INDEXING.md`](../runbooks/PROVENANCE_INDEXING.md) so it does not read as pre-outbox.
