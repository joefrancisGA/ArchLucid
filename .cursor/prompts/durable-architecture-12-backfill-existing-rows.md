# DA-12 — Conservative backfill of architecture identity

**Do not** fuzzy-merge by `SystemName` across tenants or within a tenant (name collisions are real). **Do not** merge draft and review tables. This prompt **attaches** existing rows to identities after DA-02/03/06 exist.

## Goal

Legacy data should appear on the Working architecture desk without inventing a second product.

Conservative rules (falsifiable):

1. Reviews with `ArchitectureId` already set: attach any spawn-source draft (`SpawnedRunId` / `SpawnedArchitectureVersionId`) that is still null-FK to that same id.
2. Created-origin runs with null `ArchitectureId`: call existing `EnsureCreatedRunIdentityAsync` (already creates a row) then set `DisplayName` from `SystemName` if still Untitled.
3. Drafts with `SpawnedRunId` pointing at a run that has `ArchitectureId`: set draft FK.
4. Drafts with no spawn and no FK: **one identity per draft** via `EnsureForDraftAsync` (DA-06), not merge by title.
5. Review-origin runs with `PriorRunId`: use `TryEnsureReviewRunLinkedAsync` (already tested).
6. Do **not** collapse two drafts with the same system name into one architecture.

Operator trigger: a one-shot admin/support path or startup-safe idempotent migrator **scoped per tenant** (same pattern as other DbUp backfills). Prefer **explicit API/CLI** (`archlucid` support command) over silent startup mutation of every catalog if the table is large — say which in Trade-offs of the PR. Tenant isolation on every statement.

## Why

Without backfill, DA-04 is empty for every paying seat’s history. Over-merge would join two customers’ “Payments API” into one career object — worse than leaving them split.

## Context

- `ArchitectureIdentityServiceTests`
- `EnsureCreatedRunIdentityAsync` / `TryEnsureReviewRunLinkedAsync`
- `324_ArchitectureRecurrenceAndImproveLoop.sql` (do not confuse recurrence with identity merge)
- ADR 0037

## What to build

1. Idempotent backfill in Application (one class) + SQL where set-based is safer (same NNN+1 migration or a dedicated `NNN_ArchitectureIdentityBackfill.sql`).
2. Tests: collision of two drafts named “Platform” → two identities; spawned draft links to run’s architecture; second run of backfill no-ops.
3. Do not change OpenAPI unless a support endpoint is added (document in API_CONTRACTS if you add one).

## Acceptance criteria

- Re-running backfill does not duplicate `dbo.Architectures`.
- Two same-named drafts stay two identities.
- Cross-tenant IDs never attach.

## Constraints

- Check nulls. Concrete types. Blank line before `if` / `foreach`.
- No G-REAL-06 engines.
- Do not rewrite sealed manifests.
