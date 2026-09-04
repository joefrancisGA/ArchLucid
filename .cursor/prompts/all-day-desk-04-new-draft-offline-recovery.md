# AD-04 — New architecture drafts survive offline before first persist

**Do not fork LI-12 or WA-16.** Draft autosave, 409 conflict, last-saved, and the **persisted-id** offline queue already exist. This file is the leftover **new-draft window**: `deferCreateUntilFirstSave` plus `enqueueArchitectureDraftOfflinePatch` which **requires** `architectureId`. A new `/architecture/architectures/new` session that goes offline before the first successful create has nowhere to queue.

## Goal

Typed work on a **new** architecture draft (no `draftId` yet) is recoverable in this browser after offline, refresh, or accidental close — then reconciled on reconnect via the existing create-then-patch path. Do not create a second cross-tenant draft store. Do not start a review from the recovery buffer.

## Why

Professionals start a package on a laptop, hit a tunnel flap, and expect the brief to still be there. Casual SPAs lose the first page. Persisted drafts already queue patches. The empty-id create path does not.

## Context

- `archlucid-ui/src/hooks/use-architecture-draft-autosave.ts` — `deferCreateUntilFirstSave`
- `archlucid-ui/src/hooks/use-architecture-draft-autosave-persist.ts` — offline enqueue only when `architectureId.trim().length > 0`
- `archlucid-ui/src/lib/architecture/architecture-draft-offline-queue.ts` — keyed by architectureId
- Integrity gate: `validateArchitectureDraftIntegrity` / `hasArchitectureDraftSaveableContent` — do not persist invalid secrets; do not persist API keys

## What to build

1. When `deferCreateUntilFirstSave` and there is saveable content, write a **this-browser** recovery snapshot (existing architecture draft registry / a dedicated new-draft recovery key — reuse `architecture-draft-registry` if it already supports unsaved new). Include fields + actorSet needed to recreate `createDraftRequest`.
2. On `online` / mount, if no `resolvedArchitectureId` yet, hydrate from that snapshot then call the existing persist path (create + patch).
3. `saveState` `offline` must still show **Save now** (`ArchitectureDraftWorkspaceSaveActions`). Leave-guard (`useUnsavedChangesGuard`) stays on until persist succeeds.
4. Vitest: new draft with saveable content going offline does not drop fields on remount of the same tab session (mock localStorage); persist after online calls create. Do not invent a showcase draft id.

## Acceptance criteria

- Going offline on a new draft no longer silently discards a typed brief in this browser.
- After reconnect, the server document matches the recovery snapshot (or conflict UI if create raced — prefer existing 409 pattern).
- No tenant bleed: recovery key is scoped the same way as the current draft registry (workspace/project headers).

## Constraints

- Do not persist tokens, API keys, or evidence blobs in localStorage.
- Do not weaken `validateArchitectureDraftIntegrity`.
- Do not auto-start a review from recovery.
- One class per file if C# changes; prefer UI-only.
