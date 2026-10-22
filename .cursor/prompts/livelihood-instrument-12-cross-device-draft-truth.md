# LI-12 — Signed-in drafts tell the truth and resume from the server

**Do not fork PT-13.** `resolveArchitectureDraftAutosaveSentence` already distinguishes local-only vs “Saved to your account.” This file is the **header still using the deprecated local-only constant**, plus resume order.

## Goal

Once a user is signed in and a server draft id exists, the draft workspace says typing syncs to the account. `/architecture/architectures/new` resume-first prefers **server** drafts. Browser-local registry is only the pre-id bootstrap / offline queue.

## Why

Professionals move between laptop, dock, and meeting-room PCs. `use-architecture-draft-autosave-persist.ts` already `patchDraftRequest`s. `ArchitectureDraftWorkspaceHeaderChrome` still interpolates `ARCHITECTURE_DRAFT_DETAIL_AUTOSAVE_SENTENCE`, which is aliased to **“Unsaved typing is kept on this browser until your first save.”** The resolver exists and is unused on that chrome. After the first successful save that sentence is a lie. TB-1459 local recent-drafts on `/new` can hide the server list.

## Context

- `archlucid-ui/src/lib/architecture/architecture-draft-detail-page-copy.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceHeaderChrome.tsx`
- `archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-offline-queue.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-registry.ts`
- `ArchitectureCreationLocalDraftsPanel`
- `createDraftRequest` / `patchDraftRequest` / `getDraftRequest`

## What to build

1. Replace the header’s deprecated constant with `resolveArchitectureDraftAutosaveSentence(hasServerDraftId)`. Tests that pin the old sentence must move to the new contract.
2. After sign-in, `/architecture/architectures/new` resume-first prefers the **server** draft list. Local registry is a fallback when offline or before the first PATCH.
3. Offline queue remains; when back online, drain it into the server draft. Do not drop the queue.
4. Do not keep two live editors for the same brief (handoff lock already exists when intake started — do not reopen that).
5. Vitest: copy constants; persist still calls patch; new-page resume order (server before local when both exist); header shows account sentence when id exists.

## Acceptance criteria

- After a successful save, the draft workspace does not tell the user their typing is browser-only.
- Signed-in user with a server draft sees it on another browser after list load, without the first browser’s localStorage.
- Offline typing still queues; reconnect patches.
- Saving a draft still never starts a review.

## Constraints

- Do not add a second draft store.
- Tenant isolation unchanged.
- Do not weaken handoff lock for architectures already in review intake.
