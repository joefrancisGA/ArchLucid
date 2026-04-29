# ArchLucid Product REST API — Canonical Routes

Version prefix: **`v1`** (Asp.Versioning `1.0`). New product-facing routes live **alongside** legacy `v1/architecture/…` paths until clients migrate.

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
| `POST` | `/v1/requests` | Same payload as legacy `POST /v1/architecture/request`. Supports `Idempotency-Key`. |

### Runs

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs` | Paged envelope (`PagedResponse`). Query: `page`, `pageSize`, optional `status`, `fromUtc`, `toUtc`. |
| `GET` | `/v1/runs/{runId}` | Run detail (`Guid`). Aligns with authority summary/detail projections. |
| `GET` | `/v1/runs/{runId}/progress` | Lightweight status snapshot for polling. |
| `POST` | `/v1/runs/{runId}/submit` | Product name for assessment execution (legacy: `…/execute`). |

### Manifest

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/runs/{runId}/manifest` | Golden manifest body when committed. |
| `POST` | `/v1/runs/{runId}/manifest/finalize` | Finalize/commit manifest (legacy: `…/commit`). Idempotent with server semantics + optional `Idempotency-Key`. |

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

Legacy `GET /v1/artifacts/manifests/{manifestId}/…` remains for backward compatibility.

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
