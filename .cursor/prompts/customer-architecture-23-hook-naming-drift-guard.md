# CA-23 — Hook naming drift guard

**Do not add product UX.** CA-22 should have landed or this PR completes the rename.

## Goal

CI fails if draft hooks reintroduce `architectureId` as a draft id.

1. Guard on `archlucid-ui/src/hooks/use-architecture-draft-*.ts` (and persist/hydrate files): no exported prop named `architectureId` documented as a draft id. Allow `parentArchitectureId`.
2. Guard on `architecture-routes.ts`: `architectureDraftPath` requires both ids **or** is renamed; a test pins the new signature.
3. Optional: deny `architectureId = created.draftId` assignment in persist hooks.

## Why

Without a guard, the next overlay wave will copy `architectureId` from an old test fixture and the lie returns.

## Context

- `review-terminology-guard.test.ts` (pattern)
- CA-22 leftover
- `architecture-routes.test.ts`

## What to build

1. Vitest/eslint-style unit guard (prefer Vitest file next to the hooks, matching existing terminology guards).
2. Do not change runtime behavior.

## Acceptance criteria

- A deliberate `architectureId: draftId` prop on a draft hook fails the guard.
- Identity desk paths are not flagged.

## Constraints

- Do not restore breadcrumbs.
- Do not scan `docs/archive/`.
