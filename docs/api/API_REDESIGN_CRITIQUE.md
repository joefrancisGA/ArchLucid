# ArchLucid API Surface — Defect Catalogue

This document captures the nine defect dimensions identified during the REST API review (see implementation workstream `docs/api/API_V2_ROUTES.md` for the target surface).

## 1. Implementation Details Leak

Pipeline-internal verbs and constructs exposed on public routes dilute the product narrative and complicate SDK contracts:

- Execute / replay / determinism-check / seed-fake-results expose orchestration mechanics.
- Agent evaluation, evidence packages, and execution traces expose LLM/agent internals.
- “Pipeline” terminology appears where operators expect lifecycle language (“review trail”).
- Duplicate replay surfaces (`architecture/run/.../replay` vs `authority/replay`) multiply confusion.

## 2. Resource Name Confusion

- Creating a **Run** via `POST …/architecture/request` names the input DTO, not the resource.
- Commit targets the **run** route while the durable artifact is the **manifest**.
- Summary responses mixed internal snapshot identifiers (`ContextSnapshotId`, …) with product concepts.
- Parallel run-detail endpoints (`architecture/run/{id}` vs `authority/runs/{id}`) differ in shape.
- Artifacts nested under `manifests/{manifestId}` fragment navigation from the run-centric mental model.

## 3. Missing Authorization Checks

- Governance list-by-run endpoints relied on implicit DB scoping; explicit ownership verification improves defence-in-depth.
- Approve/reject routes lacked commercial-tier parity with other governance writes.
- Pilot-only audit behaviour on execute vs. canonical actor resolution elsewhere.

## 4. Missing Idempotency

Resource-creating governance POSTs lacked mandatory idempotency keys; commit lacked a documented idempotency contract distinct from generic conflicts.

## 5. Bad HTTP Verbs

- Derived reports returned `200` where `201`/`202` communicate lifecycle better.
- Read-only resolve-profile POSTs behave like RPC without resource alignment.
- Governance transitions allowed client-supplied reviewer identity instead of JWT-derived actors.

## 6. Bad Response Shapes

- Bare arrays for run lists without pagination envelopes.
- Dual response schemas on project run list depending on query parameters.
- Oversized run aggregates without projections for list/dashboard scenarios.

## 7. Missing Pagination and Filtering

- Scope-wide run lists lacked paging parameters aligned with envelope contracts.
- Tenant audit plain list vs. search pagination behaved inconsistently.

## 8. Missing Error Contracts

- Rate-limited routes omitted documented `429` responses.
- Non-export failures reused `export-failed` problem types.
- Complex prerequisites (`422`) omitted from OpenAPI declarations.

## 9. Missing Audit Events

- Sensitive reads (manifest, provenance, findings bulk) lacked durable audit where regulated customers expect proof of access.
- Run submission (`execute`) did not always emit a durable audit row outside pilot flows.
- Governance approval **creation** needed an explicit durable event aligned with approve/reject events.

---

## Remediation Status

Implementation tracks these items via:

- Product-facing routes under `v1/runs`, `v1/requests`, `v1/internal/…`, and governance idempotency requirements.
- `ProblemTypes.BusinessRuleViolation` for operational failures that are not export failures.
- Expanded audit constants (`RunSubmitted`, `ManifestViewed`, `ReviewTrailAccessed`, `ProvenanceAccessed`, `FindingsListAccessed`, `GovernanceApprovalRequested`).
- OpenAPI-oriented `[ProducesResponseType]` additions for `422`, `429`, and `503` where applicable.
