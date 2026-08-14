> **Scope:** ADR 0064 — Align public HTTP paths and spine SQL table names with buyer vocabulary (review / finalize / signed review record) on **v1** without introducing a v2 API version.
>
> **Amended 2026-08-13:** Buyer noun is now **sealed review record**. HTTP/SQL identifiers may still say `signed-review-record` / `dbo.SignedReviewRecords` until a follow-up contract rename.

# ADR 0064: Buyer-vocabulary API and schema alignment (v1 in place)

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Owner
- **Related:** [ADR 0042](0042-canonical-run-write-surface.md), [`VOCABULARY_ROSETTA.md`](../../library/VOCABULARY_ROSETTA.md), [`CONCEPT_VOCABULARY.md`](../../library/CONCEPT_VOCABULARY.md)

## Context

Buyer surfaces say **architecture review**, **finalize**, and **signed review record**. Public HTTP and SQL still said **run**, **commit**, and **GoldenManifest**. The prior end-state rule froze those identifiers permanently and pushed all clarity into UI copy. Owner decision (2026-08-05): rename the public contract and spine tables in place on **v1** (no `v2` version bump). ArchLucid remains pre-release with no paying external API dependents that require a dual-version window.

## Decision

1. **Canonical write family stays under `v1/architecture/*`.** Path nouns change:
   - `…/run/{runId}/…` → `…/review/{runId}/…`
   - `…/commit` → `…/finalize`
   - Create remains `POST …/architecture/request` (intake DTO name; creates a review).
2. **Canonical read family collapses onto architecture reviews.** Prefer `GET /v1/architecture/reviews` and `GET /v1/architecture/review/{runId}`. Absolute `GET /v1/runs` / `GET /v1/runs/{runId}` dual routes are removed (collapse). Route parameter name may remain `runId` for binding stability; product language treats the value as a Review ID.
3. **Manifest paths use signed-review-record language.** Prefer `signed-review-record` / `signed-records` over `manifest` / `manifests` on public authority and artifact routes (existing `signed-records` aliases become primary where both existed).
4. **Evidence graph.** `GET /v1/evidence-graph/…` is the canonical knowledge-graph read surface; `/v1/graph/…` remains as a compatibility alias on the same actions for one release window.
5. **Pre-finalize governance.** ` /v1/governance/pre-finalize` is canonical; `/v1/governance/pre-commit` remains as a compatibility alias on the same controller.
6. **No API version bump.** Asp.Versioning stays at `1.0` / URL `v1` (ADR 0006 / 0013 unchanged).
7. **Spine SQL tables rename; synonyms preserve existing SQL text:**
   - `dbo.Runs` → `dbo.Reviews` (+ synonym `dbo.Runs`)
   - `dbo.GoldenManifests` → `dbo.SignedReviewRecords` (+ synonym `dbo.GoldenManifests`)
   - `dbo.CommitRunIdempotency` → `dbo.FinalizeReviewIdempotency` (+ synonym `dbo.CommitRunIdempotency`)
   - Column `RunId` stays (identity of the review row); do not rename every FK column in this ADR.
8. **C# type names** (`GoldenManifest`, `ArchitectureRun`, `PreCommitGovernanceGate`) may lag; HTTP and SQL nouns are the clarity contract. Follow-up renames are optional and do not block this ADR.
9. **Audit event type strings** already persisted are not rewritten. New code may emit buyer-aligned names in a later ADR; readers must keep accepting historical names.
10. **`RunWriteLifecycleRoutes`** records the new canonical execute/finalize templates; operation id `commit` becomes `finalize`.

## Consequences

- OpenAPI snapshot, `ArchLucid.Api.Client`, UI `api-types`, and first-party CLI/UI callers must move to the new paths in the same change set.
- DbUp migration applies renames + synonyms on existing catalogs; greenfield `ArchLucid.sql` creates legacy names then renames + synonyms at end so FKs and application SQL stay coherent.
- [`VOCABULARY_ROSETTA.md`](../../library/VOCABULARY_ROSETTA.md) end-state rule is superseded: public API/schema use buyer nouns; dual vocabulary is no longer permanent policy.
- Supersedes the "do not change HTTP paths without ADR" freeze in [`CONCEPT_VOCABULARY.md`](../../library/CONCEPT_VOCABULARY.md) § Constraints for the nouns listed above (this ADR is that change).

**Status note (2026-08-06):** Temporary dual routes from decisions 3–5 (`/v1/graph`, `/governance/pre-commit`, short `signed-records`, nested `…/manifest` and Docx `…/runs/…/architecture-package`) were **deleted** pre-release (no paying callers). Canonical paths only: `evidence-graph`, `pre-finalize`, `signed-review-records`, `…/signed-review-record`. Obsolete tenant-in-path admin aliases (`ReferenceEvidenceAdminLegacyController`, `GET …/metering/tenants/{id}/summary`) were removed the same day.

## Alternatives considered

1. **Add `v2` routes only.** Rejected by owner — prefer in-place `v1` rename pre-release.
2. **UI-only dual vocabulary forever.** Rejected — integrator and onboarding tax remains.
3. **Rename every `RunId` column and C# type in one PR.** Deferred — highest risk, lowest incremental clarity vs path/table nouns.
