# SD-08 — Remaining livelihood editors show last-saved and retry

**Do not fork WA-16** (finding notes / rationale / alert / digest — that prompt’s original list). **Do not fork LI-12** (architecture-draft autosave). **Do not fork AD-01** (inspect dirty guard). This file is **editors still outside those inventories**: Azure Boards connection form (AD-09 leftover), remaining policy-pack / standards editors, and any inspect-adjacent fields the WA-16 sweep left toast-only.

## Goal

Working-mode persisted livelihood fields that already have Save or autosave show **Last saved {time}** and TB-2155 retry on 5xx/network. No lying “Saved” state. Reuse `use-architecture-draft-autosave.ts` patterns. Do not add a second draft store.

## Why

Professionals glance at last-saved before they read a field aloud. Remaining integration and pack editors still fail closed with a toast. That is casual-form behavior on career-critical writes (Boards mapping, pack rules).

## Context

- `use-architecture-draft-autosave.ts` — exemplar
- `docs/architecture/ALL_DAY_DESK_COMPOSER_PROMPTS.md` AD-09 Azure Boards dirty — this prompt adds freshness chrome if the form already persists; do not re-implement the dirty guard
- Policy pack detail editors
- `OperatorErrorRecoveryContract` / TB-2155
- Dirty-guard inventory — wire chrome on fields already guarded; do not fork the inventory

## What to build

1. Grep remaining operator forms that call PATCH/PUT without last-saved chrome. Prioritize Azure Boards + policy pack publish/save.
2. Add last-saved + inline retry. 409 stays refresh-to-server (RS-11).
3. Vitest: failed save shows retry, not Saved; success exposes a last-saved string.
4. Draft architecture autosave must not regress.

## Acceptance criteria

- Named remaining editors show last-saved in Working.
- Guided gets the same last-saved (continuity is not density).
- No `window.confirm`. No validation toasts for client-known errors (TB-2005).

## Constraints

- Do not toast client-known validation.
- Do not lengthen 300s undo.
- Do not collapse review tabs.
