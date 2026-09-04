# WA-10 — After spawn lock, start a new draft from the snapshot (legal new object)

**Do not fork RS-04.** Spawned drafts stay editor-locked; localStorage “edit anyway” stays dead. This file is the leftover **legal path**: create a **new** architecture id from the snapshot so the architect is not stranded.

## Goal

On a spawned, locked draft, primary CTA remains **Continue in the review**. Secondary: **Start a new draft from this snapshot** — new architecture id, not a write into the spawned source. Sealed packages stay immutable. Saving a draft still never starts a review.

## Why

RS-04 closed silent divergence. Without a new-object action, the only move is the review — correct for the same work, wrong when the architect needs a version. Casual tools overlay the old file. Livelihood tools version.

## Context

- `archlucid-ui/src/lib/architecture/architecture-draft-handoff-gate.ts` — keep `isArchitectureDraftHandoffAcknowledged` false
- `ArchitectureDraftHandoffBanner.tsx` / `ArchitectureDraftWorkspace.tsx` `editorLocked`
- Draft create API / clone-from-architecture if one exists; else add a tenant-isolated clone next to existing create
- All SQL DDL in the **single** database file if a column is required
- IA-007 — do not resurrect a forever lock; do not resurrect this-browser ack

## What to build

1. Locked spawned draft: secondary button/link creates a new draft (new id) copied from the snapshot. Banner still says edits to the *old* row do not flow (editor stays locked).
2. Working list: spawned row stays **Continue in review**; optional overflow “New draft from snapshot.”
3. If the API cannot clone yet, implement clone on the existing draft DTO with tenant isolation. One class per file.
4. Vitest: clone returns a different id; spawned source remains locked; ack helper unused. Scoped compile if C# changes.

## Acceptance criteria

- Architect can version without editing the spawned source.
- Review remains the canonical surface for the spawned work.
- No localStorage ack path returns.
- Desktop review tabs not collapsed.

## Constraints

- Do not weaken sealed-manifest immutability.
- Do not use `window.confirm`.
- Do not implement **M-44**.
