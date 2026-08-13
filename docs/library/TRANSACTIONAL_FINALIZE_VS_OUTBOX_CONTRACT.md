> **Scope:** Contributor-reference — transactional finalize vs outbox/async boundary (TB-1011); not a buyer-facing trust claim.

# Transactional finalize vs outbox / async contract

**Status:** Active (V1)  
**Backlog:** **TB-1011** (this contract) · **TB-1012** (honesty CI — Done 2026-08-12)  
**Audience:** Principal architects, integration reviewers, coding agents  
**Related:** [ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md) · [DATA_CONSISTENCY_MATRIX.md](./DATA_CONSISTENCY_MATRIX.md) · [APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md](./APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009**) · [COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md](./COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**) · [ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md](./ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md) · [ARCHITECTURE_INVARIANTS.md](./ARCHITECTURE_INVARIANTS.md) **INV-003** · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-162**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-163](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#transactional-finalize-vs-outbox-m-163) · PA alias [TRANSACTIONAL_FINALIZE_VS_OUTBOX_PA_ONE_PAGER.md](../go-to-market/TRANSACTIONAL_FINALIZE_VS_OUTBOX_PA_ONE_PAGER.md)

---

## 1. Purpose

Name what belongs in **transactional finalize** versus **outbox / async workers**, and which losses must **never** be silent “best-effort” without buyer disclosure.

**One line:** A committed package proves finalize state; it does **not** prove Search indexed, webhooks delivered, Cosmos projected, or Ask is immediately current.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Commit success means indexed / delivered / projected.” | Those are async consumer outcomes (**§4**). |
| “Every audit event is transactional / fail-closed.” | Required vs informational (**INV-003** / **TB-001** / **M-117**). |
| “Outbox = exactly-once delivery.” | At-least-once dispatch; consumer idempotency required — [`TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md`](./TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md) (**TB-992** / **M-145**). |
| “V1 requires Durable Task Framework exactly-once.” | DTF adoption is **TB-924** (out of scope here). |
| “Finalize makes Ask / RAG immediately consistent.” | Retrieval indexing lags until outbox workers run (ADR 0004). |

---

## 3. In finalize UoW (same SQL TX when provider supports it)

Product-default Authority finalize is `AuthorityCommittedPipelineFinalizer`. AgentTask-owned commits still go through the Authority-driven commit orchestrator / `ManifestFinalizationService` — **not** a second storage pipeline (**TB-1007**).

| In finalize | Meaning | Path note |
|-------------|---------|-----------|
| Committed golden manifest + sealed evidence rows | Package unit of truth (**TB-1003** / **TB-1009**) | Both Authority and AgentTask commit paths |
| Run evidence-header anchors | Post-commit identity pins (**TB-310**) | Both |
| Retrieval indexing **outbox enqueue** | Durable *intent* for Search/RAG indexing (ADR 0004) — not completion | Authority finalizer enqueues in UoW when SQL TX supported |
| Integration-event **outbox enqueue** | Intent for SB/webhook-style fan-out | Prefer durable enqueue; see **§6** fail-open residual on `TryPublishOrEnqueue` |
| Required finalize / governance audit (fail-closed where classified Required) | **INV-003** Required path (**TB-953**–**TB-955**) | **Do not** assume every Authority finalize emits Required `ManifestFinalized` in the same TX — AgentTask `ManifestFinalizationService` owns some Required finalize audit; Authority may emit post-commit `RunCompleted` via best-effort `LogAsync` (**§6**) |

When the storage provider cannot share the SQL TX (in-memory doubles), integration tests must still exercise the SQL outbox path (ADR 0004 / ADR 0011).

---

## 4. Outbox / async workers (after enqueue)

| Worker / projection | Owns | Does **not** redefine |
|---------------------|------|------------------------|
| Azure AI Search / vector indexing | Index currency for Ask / RAG | Commit success |
| Service Bus / webhook / ITSM delivery | Downstream receipt / DLQ | Commit success |
| Cosmos graph / export-blob push | Secondary stores / sponsor packets | Manifest seal |
| Post-commit projections | Provenance, review-completed, rerank, IaC stubs, sample purge, etc. | Unit of truth |
| Cache invalidate / metrics | Operator freshness & observability | Forensic seal |

**Readiness:** each consumer has its own signal (index presence, delivery ack, export verify). Poll / SSE until golden manifest proves package; then check consumer readiness separately (**M-164** / **TB-1013** cluster).

---

## 5. Never silent best-effort vs disclosed best-effort

### Never silent (indefensible without disclosure)

| Loss / failure | Why it must surface |
|----------------|---------------------|
| Sealed package commit fails or is rolled back | No buyer-facing “committed” without the sealed record |
| Required audit abandon / fail-open on Required types | Breaks **INV-003** / **TB-953**–**TB-955** |
| Losing **retrieval** commit-tied outbox **enqueue** after claiming commit | Crash hole ADR 0004 exists to close |
| Tenant isolation / hard budget bypass | Security / cost safety — not soft telemetry |
| Treating integration `TryPublishOrEnqueue` swallow as “never silent already shipped” | Normative target; as-built residual in **§6** |

### Disclosed best-effort OK

| Surface | Honest framing |
|---------|----------------|
| Informational audit (**TB-001**) | May use best-effort / `TryLogAsync`; not the Required trail |
| Metering secondary writes | Process vs provider billing honesty (**M-170**) — secondary ≠ gate |
| Delivery lag / at-least-once retry | Expected; cite DLQ / replay (**TB-992**) |
| Ask / Search freshness after commit | Lag until indexer drains outbox |
| Cache / metrics | Operator convenience, not proof |

---

## 6. Residuals (as-built honesty)

### Post-`CommitAsync` audit

Some Authority finalize paths emit `RunCompleted` (or similar) **after** SQL `CommitAsync` via best-effort `LogAsync`. Required `ManifestFinalized`-class audit is stronger on the AgentTask `ManifestFinalizationService` path. That split is an **INV-003 / TB-953–TB-956** residual — do **not** re-implement same-TX for all events here (**TB-956** remains open). Buyer language: distinguish **Required fail-closed** from **informational / post-commit** without claiming “all finalize audit is transactional on every path.”

### Integration-event enqueue fail-open

`OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync` can **log and swallow** enqueue/serialization failures so `CommitAsync` still proceeds. Retrieval indexing enqueue in the Authority finalizer is **not** wrapped the same way. Until fail-closed integration enqueue ships, say: **retrieval enqueue is the ADR 0004 commit-tied guarantee; integration fan-out enqueue is best-effort-with-log today** — do not sell “every outbox intent is durable with every commit.” **TB-1012** should guard both “commit = delivered” and “all enqueue is fail-closed” overclaims.

---

## 7. CI anchors for **TB-1012**

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| Commit = Search indexed / webhook delivered / Cosmos projected | Require §3 vs §4 split + lag disclosure |
| “All audit is transactional” / “no best-effort audit” / “every Authority finalize has in-TX Required ManifestFinalized” | Require Required vs informational + §6 path split |
| “Every outbox enqueue is fail-closed with commit” | Distinguish retrieval TX enqueue vs integration `Try*` fail-open (**§6**) |
| “Exactly-once integration on commit” | Coordinate **TB-994** / **M-144**; at-least-once + consumer idempotency |
| DTF / orchestrator activity as the commit guarantee | Commit stays CAS / SQL finalize (**TB-924** out of scope) |

Mechanical gate: `scripts/ci/check_transactional_finalize_outbox_honesty.py`.

---

## 8. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Isolation and hard budgets stay never-silent; async delivery failures must not rewrite sealed packages. |
| **Scalability** | Outbox decouples commit latency from Search/ITSM fan-out; worker lag is capacity, not package loss. |
| **Reliability** | Atomic enqueue with commit closes crash-between-commit-and-intent; delivery remains at-least-once. |
| **Cost** | Avoid forcing synchronous remote I/O into finalize; disclose lag instead of overpaying for false sync. |

---

## 9. One-line buyer answer

**Finalize seals the package and durably enqueues async work; indexing, delivery, and projections can lag—and commit success never means “everything downstream is done.”**
