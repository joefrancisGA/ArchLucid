# WA-16 — Autosave shows last-saved and retry on remaining livelihood fields

**Do not fork LI-12** for architecture-draft autosave / cross-device draft truth. Draft autosave shipped. This file is **remaining livelihood editors** (finding notes, disposition rationale, alert rule drafts, digest schedules) that save without last-saved chrome or retry on failure.

## Goal

Working-mode dirty fields that already autosave or have a Save control show **Last saved {time}** (local, TB-2012 honesty if datetime) and, on failure, TB-2155 retry — not a toast-only “saved” lie. Reuse draft autosave patterns. Do not add a second draft store.

## Why

Professionals glance at last-saved before a meeting. Casual forms toast and move on. Remaining editors after LD-12/RS-07 still fail closed with no timestamp.

## Context

- `use-architecture-draft-autosave.ts` — exemplar
- Finding notes / rationale fields on inspect and review-detail
- Alert rules / digest create (already formValid — add last-saved if they persist drafts)
- `OperatorErrorRecoveryContract` / TB-2155
- Dirty-guard inventory (RS-07) — do not fork the inventory; wire chrome on fields already guarded

## What to build

1. Pick the remaining autosave/save livelihood fields (start with finding notes/rationale if they persist). Show last-saved; on 5xx/network, inline retry; do not keep a lying Saved state.
2. 409 conflicts stay RS-11 (refresh-to-server). This prompt is freshness chrome, not a new concurrency protocol.
3. Vitest: failed save shows retry, not “saved”; successful save exposes a last-saved string.

## Acceptance criteria

- Working user can see whether the note they will read aloud has hit the server.
- Draft architecture autosave does not regress.
- Guided gets the same last-saved (continuity is not density).

## Constraints

- Do not toast client-known validation (TB-2005).
- Do not use `window.confirm`.
- Do not collapse review tabs.
