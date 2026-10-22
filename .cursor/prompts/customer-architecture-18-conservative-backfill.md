# CA-18 — Conservative backfill of architecture identity

**Do not** fuzzy-merge by `SystemName` across or within a tenant. **Do not merge tables.** CA-02–04, CA-09 must exist.

## Goal

Attach existing rows without inventing a second product.

Conservative rules:

1. Reviews with `ArchitectureId` already set: attach any spawn-source draft still null-FK to that same id.
2. Created-origin runs with null `ArchitectureId`: `EnsureCreatedRunIdentityAsync` then set DisplayName from `SystemName` if still Untitled.
3. Drafts with `SpawnedRunId` pointing at a run that has `ArchitectureId`: set draft FK.
4. Drafts with no spawn and no FK: **one identity per draft** via `EnsureForDraftAsync`, not merge by title.
5. Review-origin runs with `PriorRunId`: `TryEnsureReviewRunLinkedAsync`.
6. Do **not** collapse two drafts with the same system name into one architecture.

Prefer an **explicit** support/CLI or admin path over silent startup mutation of every catalog if the table is large — say which in the PR. Tenant isolation on every statement.

## Why

Without backfill, CA-25 is empty for every paying seat’s history. Over-merge joins two “Payments API” systems — worse than leaving them split.

## Context

- DA-12 (do not paste)
- `324_ArchitectureRecurrenceAndImproveLoop.sql` (do not confuse recurrence with identity merge)
- ADR 0037

## What to build

1. Idempotent backfill in Application (one class) + SQL where set-based is safer (`NNN_ArchitectureIdentityBackfill.sql`).
2. Tests: two drafts named “Platform” → two identities; spawned draft links; second run no-ops.

## Acceptance criteria

- Re-running backfill does not duplicate `dbo.Architectures`.
- Cross-tenant IDs never attach.

## Constraints

- Do not rewrite sealed manifests.
- No G-REAL-06 engines.
