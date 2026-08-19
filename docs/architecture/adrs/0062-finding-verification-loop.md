> **Scope:** ADR 0062 — Finding verification loop (proof-of-prediction) — design record for V1.1; no V1 implementation.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0062: Finding verification loop (proof-of-prediction)

- **Status:** Proposed (target V1.1; no owner ratification yet)
- **Date:** 2026-08-03
- **Deciders:** Owner / platform engineering
- **Related:** [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md) (tenant isolation), [ADR 0039](0039-commit-sealed-evidence-immutability.md) (sealed evidence immutability), [ADR 0040](0040-tamper-evident-lineage-without-worm-storage.md), [ADR 0045](0045-committed-run-header-immutability.md), [`POSITIONING.md §5 "What proof means here"`](../../go-to-market/POSITIONING.md#what-proof-means-here), [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary`](../../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary), **TB-2033**–**TB-2037**
- **Amends:** *(none)*

## Context

ArchLucid's category claim ("Architecture Proof Engine") is deliberately scoped to **proof of diligence and provenance** — the canonical statement in `POSITIONING.md` §5 explicitly disclaims proof of runtime soundness. That scoping is honest, but static: today the product never learns whether its findings were *right*.

The pieces of a verification story already ship in V1: two-review comparison with structured golden-manifest deltas, replay with verify mode (422 on drift), compliance drift trending, and customer-run read-only cloud extractors. What is missing is the closing link: **re-examine the estate after time has passed and score each original finding against observed reality**. Once pilots accumulate, a statement like "of 40 Sev-1/2 findings across pilots, 31 were confirmed against the live estate" would let the word "proof" begin to cover predictive validity — earned, not asserted.

First-principles framing:

- **Inputs:** the finalized architecture package (findings with severity/confidence/evidence refs), a later evidence snapshot obtained through the same customer-run extractor path as V1 (no vendor credentials in the customer cloud), and optional operator annotations (e.g. "this finding materialized as incident X").
- **Outputs:** a **verification report artifact** linked to the original package, per-finding verification statuses, and an aggregate "findings confirmed" metric surfaced on the architecture scorecard.
- **Constraints:** finalized packages are immutable (ADR 0039/0045 are load-bearing — verification must never mutate the signed manifest); tenant isolation per ADR 0037; append-only audit; LLM budget guardrails; the product is **not** a runtime control plane (positioning commitment), so continuous monitoring is out.

## Decision

Introduce a **post-review verification pass**, target **V1.1**:

1. **Trigger:** operator-initiated (or scheduled per-tenant policy) N months after finalize. The tenant re-uploads an evidence snapshot via the existing extractor/ZIP path.
2. **Scoring:** each finding in the original package is classified as one of:
   - **Materialized** — the predicted risk is observable in the later snapshot or confirmed by an incident annotation;
   - **Mitigated** — the flagged condition was remediated (the recommended action, or an equivalent, is visible);
   - **Not observed** — the condition is absent and no remediation evidence exists;
   - **Not verifiable** — the later snapshot does not cover the finding's evidence scope (partial extract, decommissioned system).
3. **Artifact, not mutation:** verification results are persisted as a **new, linked artifact** (own hash, own audit events) referencing the original finding IDs. The finalized package and its `ManifestHash` are never edited. Re-verification produces a new artifact version; history is append-only.
4. **Aggregate metric:** a per-tenant "findings confirmed" rate (Materialized + Mitigated over verifiable findings) rendered on the architecture scorecard with the same evidence-basis labeling discipline as ROI figures.
5. **Claim gating:** marketing and sales copy may cite confirmation rates **only** once real pilot verification data exists, consistent with `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary`. No projected or simulated rates in buyer-facing copy.

## Decomposition

### Interfaces

- `IFindingVerificationService` — orchestrates one verification pass for a finalized package + snapshot pair; returns a `FindingVerificationReport`.
- `IFindingVerificationScorer` — pure scoring: `(Finding, EvidenceSnapshot, IReadOnlyList<OperatorAnnotation>) → FindingVerificationStatus` with an explainability trace (which snapshot elements were examined, which rule concluded the status). Deterministic rules first; LLM assistance only where a deterministic rule cannot conclude, within existing token budget guardrails, and always producing `NotVerifiable` rather than guessing.
- `IFindingVerificationReportRepository` — Dapper-style persistence for report headers and per-finding rows (per-tenant catalog, ADR 0037 scope predicates).

### Services

- **Verification pass service** (in `ArchLucid.Decisioning` or a sibling): loads the sealed package read-only, aligns findings to the new snapshot via existing evidence-graph identifiers, invokes the scorer, writes the report, emits typed audit events (new `AuditEventTypes` constants: `FindingVerificationStarted`, `FindingVerificationCompleted`).
- **Report export** (in `ArchLucid.ArtifactSynthesis`): DOCX/Markdown verification report mirroring existing export shapes.
- **Scorecard projection**: extends the existing scorecard read model with the aggregate rate.

### Data model

- `FindingVerificationReports` (report id, tenant id, source run/package id, snapshot ref, created UTC, report hash) and `FindingVerificationResults` (report id, finding id, status, rule/trace ref, annotation refs). Both append-only; DDL added to the single per-database DDL file per repo convention.

### Orchestration

- Reuses the existing Worker pipeline pattern (queue message → pass execution → outbox events), no new orchestration framework. A verification pass is a bounded batch job, not a resident monitor.

## Options considered

| Option | Description | Verdict |
| --- | --- | --- |
| **A — Snapshot-diff verification pass** *(chosen)* | Operator-triggered re-ingest + deterministic scoring against the sealed package | MVP-simple, respects immutability and the "not a runtime control plane" positioning |
| **B — Continuous monitoring agent** | Resident collector watching the estate for finding conditions | Rejected: contradicts positioning, requires standing customer-cloud credentials, large surface |
| **C — Manual attestation only** | Operators hand-mark findings as confirmed/mitigated | Rejected as sole mechanism: no evidence linkage, weak against the "proof" skeptic; retained as the annotation input to Option A |

## Trade-offs

- **Verification lag vs. freshness:** a snapshot N months later can miss transient materializations; incident annotations partially compensate. Accepted — the alternative (continuous monitoring) is out of scope by positioning.
- **False "Not observed":** partial extracts can make a real risk invisible. Mitigated by the explicit **Not verifiable** status and by excluding non-verifiable findings from the aggregate denominator.
- **Cost of re-analysis:** a pass re-runs alignment and scoring over the snapshot; deterministic-first scoring keeps LLM spend near zero, and passes are per-tenant batch jobs.

## Security, scalability, reliability, cost

- **Security:** same trust boundary as V1 evidence upload (customer-run extractors, no vendor credentials); per-tenant catalogs (ADR 0037); verification artifacts inherit sealed-evidence handling; append-only audit events.
- **Scalability:** batch pass bounded by snapshot size, same profile as an initial review; no resident processes. Aggregate metric is a cheap projection.
- **Reliability:** pass is idempotent per (package, snapshot) pair — re-running yields a new report version rather than corrupting state; failures leave the sealed package untouched by construction.
- **Cost:** marginal — reuses ingestion/decisioning infrastructure; deterministic scoring first; no new Azure resources required (no Terraform delta beyond the existing SQL DDL).

## Non-goals

- No runtime agents or collectors in customer estates.
- No load-test execution or performance validation — the proof-scope boundary (`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary`) still applies; verification extends proof toward *predictive validity of findings*, never toward runtime guarantees.
- No incident-management product; incident annotations are inputs, not a ticketing surface.
- No change to V1 scope (`V1_SCOPE.md` untouched).

## Consequences

- The "proof" claim gains a growth path: provenance today, measured predictive validity as pilots verify.
- Backlog sequencing in **TB-2033**–**TB-2037** (data model → pass → export → scorecard metric → claim-copy unlock).
