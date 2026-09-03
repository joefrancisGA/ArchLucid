# PT-09 — Instrument-ready first paint (shortcuts and session guard)

## Goal

Working-mode shell keys and session-idle protection are available **without waiting for deferred chunks**. First-load JS budget still applies to Guided/demo marketing chrome. Daily users must not pay a “keys do nothing / idle guard not up” tax on every hub navigation.

## Why

`AppShellKeyboardShortcutBoundary` lazy-imports `KeyboardShortcutProvider` after paint (`importDeferredChunkWithRetry`). `SessionIdleTimeoutGuardDeferred` is the same pattern. That is a **demo / Lighthouse / First Load JS** optimization (TB-573 / TB-691). A daily professional’s instrument is mute until the chunk arrives; the idle guard is also late. Header wrap is already correct (PT-06 residual is actions, not placement). This prompt is **when** the listener mounts.

## Context

- `archlucid-ui/src/components/shell/AppShellKeyboardShortcutBoundary.tsx`
- `archlucid-ui/src/components/shell/app-shell-deferred-chunks.tsx`
- `archlucid-ui/src/lib/operator/app-shell-chunk-manifest.ts`
- `archlucid-ui/src/components/AppShellClient.tsx`
- `archlucid-ui/src/components/KeyboardShortcutProvider.tsx`
- `archlucid-ui/src/components/SessionIdleTimeoutGuard.tsx`
- `archlucid-ui/src/lib/auth/session-idle-timeout.ts` — 60-minute idle; do not change duration
- `archlucid-ui/performance/first-load-js-baseline.v1.json` / `npm run check:first-load-js`
- `docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md` if you touch the budget

## What to build

1. **Shortcuts:** Extract a **thin always-on listener** (registry map + input guard + `router.push` / help-open callback) that does **not** import the Shift+? dialog bundle. Mount it synchronously in the shell. Keep the help overlay deferred.
2. **Idle timeout:** Mount `SessionIdleTimeoutGuard` synchronously (or a tiny equivalent that only writes activity + redirects on expiry). Security/session must not wait on a hub JS budget. Do not change `SESSION_IDLE_TIMEOUT_MS`.
3. Guided/demo: you may keep today’s deferred help overlay and other teaching chrome. Do not defer the idle guard there either if the same shell is used.
4. If First Load JS on hub routes exceeds the baseline, document the cluster (TB-2021 / TB-2022 / TB-2023 / TB-935) and offset by keeping the **dialog** deferred — do not drop the thin listener.
5. Vitest: listener registers before the deferred provider resolves; input guard still holds; idle remaining-ms math unchanged.

## Acceptance criteria

- On Working hub routes, `Alt+R` / `Ctrl+K` work on the first keydown after hydration, even if the help-dialog chunk has not loaded.
- Idle timeout still clears the session after 60 minutes of no activity (focus heartbeat unchanged).
- Shift+? still opens the existing overlay once its chunk loads.
- Guided/demo first-load budget does not silently regress without a baseline update and a one-line rationale.

## Constraints

- Do not add a second shortcut library.
- Do not start a dev server or rewrite the First Load JS pipeline unless the baseline must change.
- Do not collapse nav or tabs to shrink JS.
- Do not shorten or lengthen idle timeout in this prompt.
