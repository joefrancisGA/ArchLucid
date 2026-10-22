# CA-14 — Ensure identity on first draft save

**Do not create an identity on every keystroke.** **Do not** invent GUIDs in the browser. `EnsureForDraftAsync` (CA-09) must exist.

## Goal

On **first successful server persist** of a draft (existing autosave create path), Working **and** Guided (unless you document delaying Guided until Start review) ensure a parent identity and write `DraftRequests.ArchitectureId`.

1. Call `EnsureForDraftAsync` from **server** draft create (`DraftRequestCrudService` / create stage).
2. Second save does not create a second identity.
3. Response DTO includes `architectureId` **as the parent**, plus `draftId`.

## Why

Pre-first-save local-only copy can stay for the milliseconds before create. After create, the desk has nothing to list unless the parent exists.

## Context

- `DraftRequestCreateStage` / `DraftRequestCrudService`
- `use-architecture-draft-autosave-persist.ts` — may already assign `architectureId = created.draftId` (CA-22 renames; this prompt at least returns both ids)
- `ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE`

## What to build

1. Server hook + tests: create → identity; patch → same identity.
2. Do not implement backfill (CA-18).
3. Copy: do not claim the draft is sealed.

## Acceptance criteria

- A Working draft saved once appears on the identity list (CA-07/11) without starting a review.
- `EnsureCreatedRunIdentityAsync` still fills Created-origin runs that have no id (CA-17).

## Constraints

- No identity row without tenant/workspace/project.
- Scoped compile on Application + API tests you touch.
