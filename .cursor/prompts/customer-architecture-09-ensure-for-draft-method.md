# CA-09 — EnsureForDraftAsync (application method only)

**Do not wait** for `EnsureCreatedRunIdentityAsync`. **Do not call this from the browser inventing GUIDs.** **Do not wire first-save yet** (CA-14) unless the method cannot be tested without a draft-create hook — prefer tests that call the method directly.

## Goal

`EnsureForDraftAsync(scope, draftId, displayName)` on `ArchitectureIdentityService`:

1. If the draft already has `ArchitectureId`, return that identity (do not create a second).
2. Else create an identity with the given name (trim; fallback `Untitled architecture` only when empty) and set `DraftRequests.ArchitectureId`.
3. Idempotent under retry.
4. Clone-from-snapshot policy is **stated in the method docs**: default **same ArchitectureId** for a new unsealed copy of a spawn-locked parent (WA-10). Do not implement clone UX (CA-28).

## Why

Identity today appears when synthesis produces a run. Architects draft for hours before that. CA-14 will call this on first persist; this prompt is the kernel.

## Context

- `ArchitectureIdentityService.cs` + tests
- `IDraftRequestRepository`
- CA-03 FK, CA-04 named create

## What to build

1. New method on the existing service; extra types in their own files.
2. Tests: two drafts → two identities; two calls on one draft → one identity; missing draft → null/throw documented.
3. Do not change autosave hooks.

## Acceptance criteria

- No identity row without tenant/workspace/project.
- `EnsureCreatedRunIdentityAsync` still exists and is not deleted (CA-17).

## Constraints

- Check nulls. One class per file for new types.
- Do not implement CA-18 backfill except as a shared helper **called only from tests** if that reduces duplication.
