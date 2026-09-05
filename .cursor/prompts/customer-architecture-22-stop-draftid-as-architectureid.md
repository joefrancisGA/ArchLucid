# CA-22 — Stop calling DraftId `architectureId` in the SPA

**Do not fork CA-20 layout.** **Do not** rename backend `DraftId`. This is the mechanical honesty leftover (DA-05).

## Goal

In operator TypeScript, **`architectureId` means `ArchitectureId`**. Draft keys are `draftId`.

1. Rename locals/props/copy that pass a draft GUID as `architectureId`.
2. API wrappers: `getDraftRequest(draftId)`.
3. `ArchitectureDraftWorkspace` takes `draftId` (+ optional `parentArchitectureId`).
4. Tests that construct `architectureId: "draft-001"` are updated.

## Why

Autosave, start-review, and in-flight hrefs all say “architecture” while talking to `DraftRequests`. ADR 0074 cannot land if the hooks still lie.

## Context

- `use-architecture-draft-autosave.ts` and persist/hydrate siblings
- `use-architecture-draft-start-review.ts` (`effectiveArchitectureId`)
- `use-architecture-draft-query.ts`
- `advisoryDraftDetailHref`
- `ArchitectureDraftWorkspace.tsx`

## What to build

1. Mechanical rename in `archlucid-ui` operator code + tests.
2. Vitest: `draft-001` is not passed to identity GET.
3. Do not implement the drift guard (CA-23) unless cheap in the same PR — prefer CA-23 next.

## Acceptance criteria

- Grep of new code: `getDraftRequest(architectureId)` is gone.
- Guided teaching copy may say “architecture draft”; it must not claim the draft **is** the durable architecture.

## Constraints

- Working-tree safety on every tracked file.
- No desktop **More** menu.
