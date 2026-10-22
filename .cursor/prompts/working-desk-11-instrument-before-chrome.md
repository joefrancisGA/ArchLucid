# WD-11 — Remaining shell: instrument before deferred chrome

**Do not fork PT-09.** Sync shortcut listener and idle guard already exist. This file is the residual: Ctrl+K / skip-to-main before deferred top-bar and sidebar chunks.

## Goal

Working hub routes keep **keys, session idle, and command palette invoke** available without waiting for deferred sidebar/top-bar/help chunks. Help dialogs and teaching chrome may stay deferred. Do not drop the thin sync listener or idle guard already landed (PT-09).

## Why

`AppShellClient.tsx` still lazy-loads top bar, sidebar, help, tours, and other chrome via `app-shell-deferred-chunks.tsx`. That is a First Load JS / Lighthouse optimization (TB-573 / TB-691). Daily professionals pay a mute-or-missing-chrome tax on every hub navigation. Sync shortcut listener and sync idle guard exist; the rest of the *instrument* (palette invoke, skip-to-main, header help button behavior) can still wait on chunks.

## Context

- `archlucid-ui/src/components/AppShellClient.tsx`
- `archlucid-ui/src/components/shell/app-shell-deferred-chunks.tsx`
- `archlucid-ui/src/components/shell/AppShellSyncKeyboardShortcutListener.tsx`
- `archlucid-ui/src/components/shell/AppShellSyncSessionIdleGuard.tsx`
- `archlucid-ui/src/components/CommandPalette.tsx` / `CommandPaletteWorkActionBridge.tsx`
- `archlucid-ui/performance/first-load-js-baseline.v1.json` / `npm run check:first-load-js`
- `docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md` (TB-2021 / TB-2022 / TB-2023 / TB-935)
- PT-09: do not re-defer shortcuts/idle

## What to build

1. Keep sync shortcut listener + idle guard. Extend so **Ctrl+K** opens the palette (or a thin palette host) without waiting for `OperatorShellTopBarDeferred` if that is the current mount path.
2. Skip-to-main / `#main-content` focus must work before sidebar chunk resolves.
3. Guided/demo: help overlay and tours stay deferred. Do not defer idle guard there either.
4. If First Load JS exceeds baseline, document the cluster and offset by keeping **dialog/tour** deferred — do not drop the thin listener. Cite field p75 or “no field data yet.”
5. Vitest: listener + palette host register before deferred top bar; input guard holds; idle remaining-ms math unchanged (`SESSION_IDLE_WORKING_TIMEOUT_MS` stays 4h).

## Acceptance criteria

- Working hub: Alt+R / Ctrl+K work on first keydown after hydration even if sidebar/top-bar chunks have not loaded.
- Shift+? still opens the existing overlay once its chunk loads.
- Idle timeout still clears after the Working 4h / Guided 60m policy.
- Baseline does not silently regress without a one-line rationale.

## Constraints

- Do not add a second shortcut library.
- Do not start a dev server or rewrite the First Load JS pipeline unless the baseline must change.
- Do not collapse nav or tabs to shrink JS.
- Do not shorten or lengthen idle timeout in this prompt.
