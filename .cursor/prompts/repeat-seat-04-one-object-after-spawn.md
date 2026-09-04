# RS-04 — One canonical object after spawn (no silent parallel draft)

**Do not fork WD-10 or LI-06 for Alt+N / home CTA.** This file is unique leftover of **IA-007**: the handoff lock is still a **soft gate** whose acknowledgment lives in **this browser**.

## Goal

After a draft spawns a review, the **review is the only editable architecture surface** for that work unless the product explicitly starts a **new version / new draft** (a new object). “Edit draft anyway” must not be a one-click localStorage ack that lets two copies diverge. Sealed packages stay immutable.

## Why

Livelihood data loss: architects edit the wrong copy and defend the wrong version in a meeting. Current gate (`architecture-draft-handoff-gate.ts`):

- Banner is honest: editing here does not update the in-flight or sealed package.
- `ARCHITECTURE_DRAFT_HANDOFF_ACKNOWLEDGE_LABEL` = “Edit draft anyway — changes will not update the review.”
- Ack is `localStorage` key `archlucid.architecture_draft_handoff_ack.v1.{architectureId}`.
- Telemetry counts post-spawn edits (`ArchitectureDraftPostSpawnEdit`).

A professional tool does not store “I accepted divergence” in one browser. Dock vs home laptop re-locks; a colleague never sees the ack. The owner rejected a hard permanent lock in 2026-07-14 for IA-007 — this prompt does **not** resurrect a forever lock. It requires a **server-visible, reversible** choice: continue in the review, **or** create a new draft/version that does not pretend to be the same object.

## Context

- `archlucid-ui/src/lib/architecture/architecture-draft-handoff-gate.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDraftHandoffBanner.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx` — `editorLocked`
- `docs/architecture/information_architecture_assessment_and_backlog.md` IA-007
- Draft conflict panel already exists for 409 — reuse patterns, do not invent a second confirm stack

## What to build

1. Remove “acknowledge in localStorage then edit the spawned draft.” Primary CTA remains the linked review. Secondary, if product-legal: **Start a new draft from this snapshot** (new architecture id) — never silently write into the spawned source.
2. If a server flag is required so the choice survives devices, add it to the existing draft DTO / user-preferences style API. All SQL DDL in the **single** database file. Tenant isolation on any new mutation.
3. Working nav/list: a spawned draft row labels **Continue in review**, not “Resume draft.” Guided may keep a teaching sentence.
4. Keep the banner copy that edits do not flow into the existing review — until you delete the anyway-path.
5. Vitest: spawned draft without new-object action does not enable the editor; ack helper either gone or unused; new-draft action (if built) creates a different id. Scoped compile if C# changes.

## Acceptance criteria

- After spawn, the architect cannot fat-finger the old draft into a diverged copy from a this-browser ack.
- The review remains the canonical work surface.
- Saving a draft still never starts a review.
- Desktop review tabs are not collapsed.

## Constraints

- Do not weaken sealed-manifest immutability.
- Do not implement principal-architect dismissal cohort (**M-44**).
- One class per file; no `ConfigureAwait(false)` in tests.
- Do not use `window.confirm`.
