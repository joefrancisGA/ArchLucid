# REST API redesign — implementation notes (2026-04)

This complements [`API_V2_ROUTES.md`](API_V2_ROUTES.md) and [`API_REDESIGN_CRITIQUE.md`](API_REDESIGN_CRITIQUE.md). It records **what shipped in code** versus **still duplicated for backward compatibility**.

## Objective

Ship the redesign incrementally: **canonical routes** plus **legacy aliases** so existing clients keep working while SDKs move to the cleaner paths.

## What shipped

### Runs & manifest

- **Paged lists**: `GET /v1/runs` and `GET /v1/authority/projects/{projectId}/runs` return `PagedResponse<T>` (no dual JSON shapes).
- **Aliases**: `POST …/submit` beside `…/execute`; `POST …/manifest/finalize` beside `…/commit`.
- **`RunSubmitted`** audit on successful submit (not pilot-only).
- **`InvalidOperationException`** on finalize maps to **`BusinessRuleViolation`**, not export failures.

### Review trail & manifest reads (`AuthorityQueryController`)

- **`GET /v1/runs/{runId}/review-trail`** → same payload as `…/pipeline-timeline`.
- **`GET /v1/runs/{runId}/review-trail/rationale`** and **`…/provenance`** duplicate legacy authority routes.
- **`GET /v1/runs/{runId}/manifest`** returns golden manifest JSON; emits **`ManifestViewed`** when present.
- Audits: **`ReviewTrailAccessed`** (timeline), **`ProvenanceAccessed`** (graph).

### Internal / operator diagnostics

- **`RequireOperatorRole`** on **`/v1/internal/architecture/*`** (replay, determinism, seed) and **`RunAgentEvaluationController`** (`/v1/internal/architecture/…`, legacy alias retained).
- **`AuthorityReplayController`** canonical path **`POST /v1/internal/authority/replay`** with alias **`POST /v1/authority/replay`**.

### Artifacts

- **`GET /v1/runs/{runId}/artifacts`** (+ **`…/bundle`**, **`…/{artifactId}`**) resolve manifest via run and delegate to existing manifest-keyed handlers.

### Governance

- **`Idempotency-Key`** required for persisted **`approval-requests`**, **`promotions`**, **`activations`** (waived when `dryRun=true` where applicable).
- **`GovernanceApprovalRequested`** audit on successful approval-request create (non–dry-run).
- **`reviewedBy` / `PromotedBy` body overrides removed** — actor comes from **`IActorContext`** (`Approve`, `Reject`, `BatchReview`, `Promote`).

### Contracts & tests

- **`RunSummaryResponse`**: internal snapshot GUIDs removed; **`Has*`** flags only.
- **`openapi-v1.contract.snapshot.json`** refreshed when OpenAPI drifted.

## Alternatives considered

| Approach | Trade-off |
|----------|-----------|
| **Hard-remove legacy routes** | Breaks existing integrations; deferred until clients migrate. |
| **Full merge of `RunQueryController` + `AuthorityQueryController`** | Large refactor risk; instead aligned routes and shared paging/envelopes first. |
| **DB-backed idempotency for governance POSTs** | Stronger dedupe guarantees; not implemented here — header is **required** and hashed into audit payload for traceability. |

## Operational considerations

- **429 / rate limits**: additional **`ProducesResponseType(429)`** on rate-limited controllers improves SDK/OpenAPI accuracy.
- **Governance clients** must send **`Idempotency-Key`** on mutating POSTs (except dry-run flows where documented).

## Security

- Operator diagnostics gated by **`RequireOperatorRole`** (plus existing tier checks where applicable).
- Governance non-repudiation: server-derived reviewer/promoter identity only.

## Reliability / cost

- No new cross-region stores for governance idempotency in this slice — **audit + validation only**; scale-out dedupe remains a follow-up if duplicate submits become measurable.
