# PT-13 — Signed-in drafts sync across devices; copy tells the truth

## Goal

Once a user is signed in and a server draft id exists, typing debounce-patches that draft. Resume lists and `/architecture/architectures/new` lead with **server** drafts. Buyer copy must not say unsaved typing lives only on “this browser” after the first successful save. Browser-local registry is only the pre-id bootstrap / offline queue.

## Why

`ARCHITECTURE_DRAFT_DETAIL_AUTOSAVE_SENTENCE` currently: “Autosave keeps unsaved typing on this browser; saved drafts sync where you sign in.” Professionals move between laptop, dock, and meeting-room PCs. `use-architecture-draft-autosave-persist.ts` already `patchDraftRequest`s. The contract in the UI is still a casual-app local buffer. TB-1459 local recent-drafts on `/new` can hide the server list.

## Context

- `archlucid-ui/src/lib/architecture/architecture-draft-detail-page-copy.ts`
- `archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-offline-queue.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-registry.ts` (browser registry)
- `/architecture/architectures` list vs `/architecture/architectures/new` local panel (`ArchitectureCreationLocalDraftsPanel`)
- `createDraftRequest` / `patchDraftRequest` / `getDraftRequest`
- PT-03 owns expert start path; this prompt owns **where bytes live**

## What to build

1. Rewrite autosave copy: before first server id — honest local/offline; after save — “Saved to your account” / last-saved UTC (reuse save-state machine). Tests that pin the old sentence must move to the new contract.
2. After sign-in, `/architecture/architectures/new` resume-first (TB-1462) prefers the **server** draft list. Local registry is a fallback when offline or before the first PATCH.
3. Offline queue remains; when back online, drain it into the server draft. Do not drop the queue.
4. Do not keep two live editors for the same brief (handoff lock already exists when intake started — do not reopen that).
5. Vitest: copy constants; persist still calls patch; new-page resume order (server before local when both exist).

## Acceptance criteria

- After a successful save, the draft workspace does not tell the user their typing is browser-only.
- Signed-in user with a server draft sees it on another browser after preferences/list load, without the first browser’s localStorage.
- Offline typing still queues; reconnect patches.
- Saving a draft still never starts a review.

## Constraints

- Do not add a second draft store.
- Tenant isolation unchanged (draft APIs stay in-tenant).
- Do not weaken handoff lock for architectures already in review intake.
