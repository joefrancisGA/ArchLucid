# LD-08 — Command palette opens on the first Ctrl+K

**Do not fork PT-09** for the sync shortcut listener or idle guard — `AppShellSyncKeyboardShortcutListener` and `AppShellSyncSessionIdleGuard` already mount. Do not fork LI-07 for findings/alerts handler actions. This file is **the palette chunk still losing the first keydown**.

## Goal

On Working hub and review-detail routes, **Ctrl+K / ⌘K** opens the command palette on the first keydown after hydration. Preload may stay; a dead first press is not acceptable. Shift+? overlay may remain deferred. First Load JS budget still applies to Guided/demo marketing chrome.

## Why

Consumer sites optimize Lighthouse. Professional tools optimize the 200th keystroke — and the first one after lunch. `useCommandPaletteChunkPreload` warms the chunk on Ctrl+K, which means the **first** press can still no-op if the host waits for the chunk. Palette is how all-day users jump and (after LI-07) dispose. A map that ignores the first chord is a casual SPA.

## Context

- `archlucid-ui/src/hooks/use-command-palette-chunk-preload.ts`
- `archlucid-ui/src/components/shell/AppShellSyncCommandPaletteHost.tsx`
- `archlucid-ui/src/components/CommandPalette.tsx` / `CommandPaletteTopBarTrigger.tsx`
- `archlucid-ui/src/components/shell/AppShellKeyboardShortcutBoundary.tsx` — still lazy-imports `KeyboardShortcutProvider` for the overlay; keep overlay deferred
- `archlucid-ui/src/lib/operator/app-shell-chunk-manifest.ts`
- `archlucid-ui/performance/first-load-js-baseline.v1.json`
- Input guard `isEditableTarget`

## What to build

1. First Ctrl+K in Working must open the palette (or queue the open until the chunk resolves **without requiring a second keydown**). Prefer opening a lightweight host immediately.
2. Keep Shift+? / help overlay deferred.
3. Keep the input guard (no palette from a text field unless the existing exception applies).
4. If First Load JS on hub routes exceeds the baseline, document the cluster (TB-2021 / TB-2022 / TB-2023 / TB-935) and offset by keeping the **overlay body** deferred — do not drop the first-press contract.
5. Vitest: first Ctrl+K sets open intent; input guard still holds; Guided/demo baseline does not silently regress without a one-line rationale.

## Acceptance criteria

- Working user: first Ctrl+K after hydration opens the palette (no “dead first press”).
- Shift+? still opens the existing overlay once its chunk loads.
- Idle timeout / sync navigation chords (Alt+R, etc.) stay as shipped in PT-09 / LI-07.
- Editable fields still swallow the chord.

## Constraints

- Do not add a second shortcut library.
- Do not start a dev server or rewrite the First Load JS pipeline unless the baseline must change.
- Do not collapse nav or tabs to shrink JS.
- Do not shorten or lengthen idle timeout in this prompt.
