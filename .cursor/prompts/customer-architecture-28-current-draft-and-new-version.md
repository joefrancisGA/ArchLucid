# CA-28 — Current draft and new version

**Do not fork WA-10** except to parent the clone on the same `ArchitectureId`. **Do not** unlock spawn via localStorage.

## Goal

Desk current-draft slot:

1. Link to the unlocked draft child editor (CA-20).
2. Spawn-locked draft: handoff copy + **Open review** (ADR 0072) + **New version** / clone-from-snapshot that **keeps ArchitectureId** (CA-09 default).
3. No open draft: **New draft version** creates a draft under this identity (not a new architecture).

## Why

Clone that mints a new ArchitectureId fragments the career object. “New architecture” vs “new version” must be distinct actions.

## Context

- WA-10 clone-from-snapshot
- `architecture-draft-handoff-gate.ts`
- CA-09 / CA-14

## What to build

1. Desk controls + server clone/create under existing ArchitectureId.
2. Tests: clone keeps ArchitectureId; “New architecture” on the hub still creates a new identity (CA-24).

## Acceptance criteria

- New version does not appear as a second portfolio row.
- Spawn lock still prevents editing the locked draft in place.

## Constraints

- ADR 0071 undo stack discards on spawn lock (already decided).
- No merge engine (LK-12).
