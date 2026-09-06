# CA-16 — Start review copies ArchitectureId from the draft

**Do not fork** ADR 0072 handoff UI. **Do not merge tables.** CA-14 should have set the draft FK.

## Goal

When a draft **starts a review** / spawn:

1. The new run is linked with `TryLinkRunToArchitectureAsync` / `TryEnsureReviewRunLinkedAsync` using the **draft’s** `ArchitectureId` first, not only `PriorRunId`.
2. If the draft FK is still null (legacy), ensure then link (CA-09) — do not spawn an orphan review if the draft is in scope.
3. Spawn lock + review URL remain ADR 0072.

## Why

A review that does not hang off the architecture is a second Monday object. That is the current livelihood failure.

## Context

- `ArchitectureIdentityService.TryLinkRunToArchitectureAsync`
- Start-review / spawn orchestrators
- `use-architecture-draft-start-review.ts`

## What to build

1. Server spawn path uses draft.ArchitectureId.
2. Tests: draft with FK → run.ArchitectureId matches; draft without FK → ensure then match; other architecture’s reviews excluded.

## Acceptance criteria

- Two reviews from one draft lineage share one ArchitectureId.
- Clone-from-snapshot (WA-10) stays the same identity (CA-09 default).

## Constraints

- Do not unlock spawn via localStorage.
- Do not rewrite sealed manifests.
