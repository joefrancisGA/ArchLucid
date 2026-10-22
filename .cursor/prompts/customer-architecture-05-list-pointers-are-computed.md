# CA-05 — Child pointers are computed, not stored on Architectures

**Do not add** `CurrentDraftId` / `LatestReviewId` columns to `dbo.Architectures`. **Do not fork CA-07** list query implementation beyond a documented DTO shape.

## Goal

Decide and record (ADR 0074 Related or a short note in 0074 Consequences — **do not rewrite** the Accepted body if already Accepted; add a Related pointer only) that:

1. **Current open draft** = latest unsealed `DraftRequests` row with this `ArchitectureId` and no spawn-lock (or the unlocked draft; match `architecture-draft-handoff-gate`).
2. **Latest review** = latest `Reviews`/`Runs` row with this `ArchitectureId` by `UpdatedUtc` / created.
3. **Latest sealed manifest** may stay on the identity row (`LatestSealedManifestId` already exists) — do not duplicate sealed bytes.

If you need a DTO for later list/get, add `ArchitectureIdentityListItem` / `ArchitectureIdentityChildPointers` as **new files** with computed fields only. No repository write of those pointers.

## Why

Denormalized current-draft ids go stale the moment two tabs save. Casual SPAs cache “the” child. Livelihood desks query children. Storing them on the parent invites last-write-wins of the wrong object.

## Context

- `ArchitectureIdentityRecord.LatestSealedManifestId`
- `architecture-draft-handoff-gate.ts` (spawn lock)
- ADR 0074 / 0068

## What to build

1. DTO type(s) + a small resolver class (one class per file) **or** a documented query plan in the PR if CA-07 will own the SQL.
2. Tests: two drafts, one spawn-locked → current draft is the unlocked one; two reviews → latest wins; other tenant’s children excluded.
3. No HTTP.

## Acceptance criteria

- A reviewer can quote this decision to refuse `UPDATE Architectures SET CurrentDraftId`.
- LatestSealedManifestId remains the only stored child-ish pointer (already shipped).

## Constraints

- Tenant isolation on every query.
- Do not merge tables.
