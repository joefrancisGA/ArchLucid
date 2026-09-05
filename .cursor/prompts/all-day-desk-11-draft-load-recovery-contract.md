# AD-11 — Architecture draft load failure uses the TB-2155 recovery contract

**Do not fork AD-08** if that session already added draft load to the inventory. Prefer this file as the **named** draft-load owner. `ArchitectureDraftDetailLoadFailure` exists for buyer-polished detail. Full-operator / new-draft load error in `ArchitectureDraftWorkspaceBody` is still a helper `<p role="alert">` + Retry.

## Goal

Every architecture-draft **load** failure (new and detail, both shells) renders `OperatorErrorRecoveryContract` (or the existing detail failure view wired to the same markers): what failed, that typed-but-unsaved recovery may still be in this browser (if AD-04 shipped) or that the server document is intact, and Retry / back to architectures list. Add the source root to `ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES`.

## Why

Losing the brief on a failed GET is a livelihood event. Casual tools show a red sentence. The golden-path contract already exists for package load. Draft load should match.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx` — `loadError` branch
- `archlucid-ui/src/components/architecture/ArchitectureDraftDetailLoadFailure.tsx`
- `error-recovery-contract-inventory.ts`
- AD-04 recovery snapshot — mention in “what’s intact” only if that buffer exists; do not lie that a server draft exists on first create

## What to build

1. Replace the bare operator load-error branch with the contract component (reuse copy helpers). Buyer-polished detail failure should share the same three lines, not a parallel dialect.
2. Next step: Retry calls `loadDraft`; secondary link to `ARCHITECTURES_LIST_PATH`.
3. Inventory + Vitest: draft load root listed; Retry still present.

## Acceptance criteria

- Full operator and buyer-polished draft load failures both teach intact vs retry.
- No toast-only load failure.
- Autosave persist path unchanged.

## Constraints

- Do not toast client-known empty system name (TB-2005).
- Do not implement AD-08’s other roots here.
- Do not collapse review tabs.
