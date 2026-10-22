> **Scope:** Canonical product-facing HTTP paths under v1 for implementers and client authors; not auth configuration, OpenAPI bundles, or non-HTTP contracts.

# ArchLucid Product REST API — Canonical Routes

Version prefix: **`v1`** (Asp.Versioning `1.0`). This document originally proposed a product-facing `v1/requests` / `v1/runs/*` naming layer alongside `v1/architecture/*`; ADR 0042 settled the opposite direction — **`v1/architecture/*` is the one canonical family** — and the `v1/requests` / `v1/runs/{runId}/submit` / `v1/runs/{runId}/manifest/finalize` aliases were retired once the coordinator strangler migration closed pre-release (`docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md`). The write rows below are corrected to the live routes; read-only `v1/runs/*` query routes (`GET`) are unaffected and remain live on `RunQueryController`.

## Resource Taxonomy

| Concept | Meaning |
|--------|---------|
| **Request** | Operator intent to assess an architecture (created with the run). |
| **Run** | Execution instance for that assessment. |
| **Manifest** | Finalized golden manifest for the run. |
| **Finding** | Structured issue/recommendation emitted from analysis. |
| **Artifact** | Synthesized downloadable output tied to the manifest. |
| **Review trail** | Audit timeline + rationale + provenance for explainability. |

## Canonical Routes

### Architecture requests

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/v1/architecture/request` | Canonical create route. Supports `Idempotency-Key`. |

### Runs

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs` | Paged envelope (`PagedResponse`). Query: `page`, `pageSize`, optional `status`, `fromUtc`, `toUtc`. |
| `GET` | `/v1/runs/{runId}` | Run detail (`Guid`). Aligns with authority summary/detail projections. |
| `GET` | `/v1/runs/{runId}/progress` | Lightweight status snapshot for polling. |
| `POST` | `/v1/architecture/review/{runId}/execute` | Canonical assessment-execution route. |

### Manifest

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs/{runId}/manifest` | Golden manifest body when committed. |
| `POST` | `/v1/architecture/review/{runId}/finalize` | Canonical finalize/commit route. Idempotent with server semantics + optional `Idempotency-Key`. |

### Findings

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs/{runId}/findings` | List findings (paged). |
| `GET` | `/v1/runs/{runId}/findings/{findingId}` | Detail including evidence chain. |
| `POST` | `/v1/runs/{runId}/findings/{findingId}/feedback` | Thumbs feedback (`/v1/explain/…` legacy retained). |

### Artifacts

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs/{runId}/artifacts` | Descriptor list (resolved via run → golden manifest). |
| `GET` | `/v1/runs/{runId}/artifacts/{artifactId}` | File download. |
| `GET` | `/v1/runs/{runId}/artifacts/bundle` | ZIP bundle. |

Legacy `GET /v1/artifacts/signed-review-records/{manifestId}/…` remains for backward compatibility.

### Review trail

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs/{runId}/review-trail` | Audit timeline (legacy: `authority/runs/…/pipeline-timeline`). |
| `GET` | `/v1/runs/{runId}/review-trail/rationale` | Rationale (legacy: `authority/runs/…/rationale`). |
| `GET` | `/v1/runs/{runId}/review-trail/provenance` | Decision provenance graph. |
| `GET` | `/v1/runs/{runId}/review-trail/export` | ZIP export (legacy: `traceability-bundle.zip`, `artifacts/runs/…/export`). |

### Internal / operator diagnostics (`RequireOperatorRole`)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/v1/internal/architecture/runs/{runId}/replay` | QA replay (legacy public paths removed from primary SDK). |
| `POST` | `/v1/internal/architecture/runs/{runId}/determinism-check` | |
| `POST` | `/v1/internal/architecture/runs/{runId}/seed-fake-results` | Dev scaffolding; permission `seed:results` still applies. |
| `GET` | `/v1/internal/architecture/runs/{runId}/agent-evaluation` | Structural evaluation of traces. |

### Governance idempotency

These POSTs **require** `Idempotency-Key` (reject with `400` + `ProblemTypes.ValidationFailed` when absent):

- `POST /v1/governance/approval-requests`
- `POST /v1/governance/promotions`
- `POST /v1/governance/activations`

## Standard Envelopes

### Paged list (`PagedResponse<T>`)

```json
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 25,
  "hasMore": false
}
```

### Problem Details (RFC 9457)

Use stable `type` URIs from `ProblemTypes` (`https://archlucid.example.org/errors#…`). Include `traceId` via standard middleware.

### Error taxonomy additions

- **`business-rule-violation`** — `ProblemTypes.BusinessRuleViolation` for invalid operations that are not export failures.

## Audit Events (durable)

| Trigger | `AuditEventTypes` constant |
|---------|---------------------------|
| Run submission | `RunSubmitted` |
| Manifest GET (regulated customers) | `ManifestViewed` |
| Review trail GET | `ReviewTrailAccessed` |
| Provenance GET | `ProvenanceAccessed` |
| Findings list GET | `FindingsListAccessed` |
| Governance approval create | `GovernanceApprovalRequested` |

Legacy events (`GovernanceApprovalSubmitted`, manifest finalize, etc.) continue unchanged.
