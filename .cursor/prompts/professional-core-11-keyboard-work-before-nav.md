# PC-11 — Keyboard work before navigation (LK-11 completion)

**Do not fork LK-11 / IS-10** — complete them. **Do not fork LD-08** first Ctrl+K. **Do not add** single-letter shortcuts (WCAG 2.1.4).

## Goal

1. **Default Working landing** on review-detail: `reviewTab=findings` (or workbench) when package is triage-ready — not Activity or marketing-style Overview.
2. **Command palette** group order: **This review** work actions (save, finalize when ready, next/prev finding, dispositions) **before** route jumps.
3. **Shift+?** documents work combos before global Alt+* nav (update `KEYBOARD_SHORTCUTS.md`).
4. Finalize and Save palette rows respect trail + skipped-MUST + measurement floor gates (PC-01).

## Why

Keyboard bolted onto a mouse SPA keeps navigation as the primary muscle memory. Livelihood tools triage **findings** hundreds of times per day; routes are secondary.

## Context

- `livelihood-kernel-11-keyboard-triage-is-the-job.md`
- `command-palette-handler-actions.ts`, `useShortcutNavigation`
- `review-detail-workspace-tabs.ts`
- `KEYBOARD_SHORTCUTS.md`

## What to build

Implement LK-11 + IS-10 leftovers. Vitest: palette group order; default tab on Working fixture.

## Acceptance criteria

- Architect can triage first finding via keyboard without mouse on load (mock Execute+).
- Palette does not list finalize when gates fail (disabled + reason inline).

## Constraints

- Header inside shortcut listener (AD-10 truth — do not resurrect old doc lie).
