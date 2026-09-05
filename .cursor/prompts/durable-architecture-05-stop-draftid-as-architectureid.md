# DA-05 — Stop calling DraftId `architectureId` in the SPA

**Do not fork DA-04** layout. **Do not** silently break `/architecture/architectures/{draftId}` bookmarks. This prompt is the **naming and routing honesty** leftover: the Working SPA currently uses `architectureId` as a variable for **draft** ids (`use-architecture-draft-autosave.ts`, `getDraftRequest(architectureId)`, etc.).

## Goal

In operator TypeScript, **`architectureId` means `ArchitectureId`**. Draft keys are `draftId`.

1. Rename locals/props/copy that pass a draft GUID as `architectureId`.
2. Keep a **compatibility redirect**: Working GET `/architecture/architectures/{id}` when `id` is a known `DraftId` → handoff or rewrite to the parent identity (DA-04 route) + draft child. If identity is missing (legacy), keep the draft editor and show an honesty line that this is a draft, not the durable architecture (until DA-12).
3. API client wrappers: `getDraftRequest(draftId)`.
4. Do not rename backend `DraftId`.

## Why

Livelihood bugs start with the wrong object. Autosave, start-review, and in-flight hrefs all say “architecture” while talking to `DraftRequests`. ADR 0074 cannot land in the desk if the hooks still lie.

## Context

- `use-architecture-draft-autosave.ts`, `use-architecture-draft-autosave-hydrate.ts`, `use-architecture-draft-autosave-persist.ts`
- `use-architecture-draft-start-review.ts` (`effectiveArchitectureId`)
- `use-architecture-draft-query.ts`
- `advisoryDraftDetailHref`
- Tests that construct `architectureId: "draft-001"`
- ADR 0072 spawn-locked handoff — still valid; it is a **draft** URL

## What to build

1. Mechanical rename in `archlucid-ui` operator code + tests. Prefer a small helper `isDraftRouteId` only for the compatibility redirect.
2. Vitest: a fixture named `draft-001` is not passed to identity GET; identity GET uses a distinct id.
3. Drift-guard test: operator files under `src/hooks/use-architecture-draft-*.ts` do not declare a prop named `architectureId` that is documented as a draft id. (Allow `parentArchitectureId`.)
4. Do not implement ensure-on-save (DA-06) except to read `draft.architectureId` if the wire already has it.

## Acceptance criteria

- Grep of new code: `getDraftRequest(architectureId)` is gone.
- Old draft bookmarks still open something useful (editor or parent desk), not 404.
- Guided teaching copy may still say “architecture draft”; it must not claim the draft **is** the durable architecture.

## Constraints

- No desktop **More** menu.
- Do not merge tables.
- Working-tree safety on every tracked file.
