# DA-06 — Ensure architecture identity on first draft save

**Do not wait** for `EnsureCreatedRunIdentityAsync` (Created-origin **run**). **Do not** create an identity on every keystroke. This prompt is **when** the parent row appears.

## Goal

On **first successful server persist** of a draft (the existing autosave create path), Working (and Guided, unless you have a documented reason to delay until Start review) **ensures** a parent `dbo.Architectures` row and writes `DraftRequests.ArchitectureId`.

1. Display name = draft system name / title, trimmed; fallback `Untitled architecture` only when empty (DA-02 backfill string).
2. Idempotent: second save does not create a second identity.
3. Clone-from-snapshot (WA-10): new draft **new** identity unless the clone API explicitly says “same architecture, new draft version” — **prefer same ArchitectureId** for clone-from-snapshot of a spawn-locked parent (new unsealed working copy of the **same** system). State the choice in the PR; default **same identity**.
4. Spawn/start review: link the new run with existing `TryLinkRunToArchitectureAsync` / `TryEnsureReviewRunLinkedAsync` using the **draft’s** `ArchitectureId` first, not only `PriorRunId`.

## Why

Identity today appears when synthesis produces a run. Architects draft for hours before that. Pre-first-save local-only copy (`ARCHITECTURE_DRAFT_AUTOSAVE_LOCAL_ONLY_SENTENCE`) can stay for the milliseconds before create; after create, the parent identity must exist or the desk has nothing to list.

## Context

- DA-02 FK, DA-03 ensure method
- `ArchitectureIdentityService.EnsureCreatedRunIdentityAsync`
- `DraftRequestCreateStage` / `DraftRequestCrudService`
- `use-architecture-draft-autosave-persist.ts` create-on-first-save
- `ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE`

## What to build

1. Application: `EnsureForDraftAsync(scope, draftId, displayName)` in the identity service (new method on the existing class is OK; extra types in their own files).
2. Call from draft create (server), not from the browser inventing GUIDs.
3. Tests: two creates → two identities; two patches of one draft → one identity; spawn uses draft.ArchitectureId.
4. Copy: after server id exists, keep account autosave sentence; do not claim the **draft** is sealed.

## Acceptance criteria

- A Working draft saved once appears on the identity list (DA-03/04) without starting a review.
- `EnsureCreatedRunIdentityAsync` still fills Created-origin runs that have no id (legacy).
- No identity row without tenant/workspace/project.

## Constraints

- Check nulls. One class per file for any new type.
- Scoped compile on Application + API tests you touch.
- Do not implement DA-12 backfill of historical rows except as a shared helper **called only from tests** if that reduces duplication — production backfill is DA-12.
