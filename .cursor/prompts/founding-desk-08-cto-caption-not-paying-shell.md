# FD-08 — CTO demo caption is not on the paying shell graph

**Do not fork WA-03** for engineer widgets vs Working density. This file is leftover **eval chrome in the shell module graph**: `AppShellClient` always defers `CtoDemoJourneyCaptionBar`. The component null-renders unless buyer-polish + tour active, but the paying seat still downloads/registers the chunk.

## Goal

Paying Working shell does not import or mount CTO journey caption unless eval/demo chrome is actually on (`resolveProductionEvalChrome` / existing `isCtoDemoPackEnv` / tour-active). Guided + active CTO tour may keep the caption. No new env flag.

## Why

A livelihood desk should not carry sales-presenter chunks on every page. First-load JS and mental model both treat the paying architect as a prospect.

## Context

- `archlucid-ui/src/components/AppShellClient.tsx` — `CtoDemoJourneyCaptionBarDeferred`
- `archlucid-ui/src/components/cto-demo/CtoDemoJourneyCaptionBar.tsx` — already gates on `isBuyerPolishedOperatorShellEnv()`
- `archlucid-ui/src/lib/operator/app-shell-chunk-manifest.ts`
- `archlucid-ui/src/lib/production-desk-chrome.ts`
- `app-shell-deferred-imports.test.ts`

## What to build

1. Mount the deferred caption only when eval/demo chrome is on (reuse resolver; do not call buyer-polish alone if the resolver exists for this case).
2. Paying Working: manifest/test proves the caption is not on the default full-shell path (or is tree-shaken behind the gate).
3. Vitest: Working fixture does not render `cto-demo-journey-caption-bar`. Tour-active buyer fixture still can.

## Acceptance criteria

- Working paying shell first paint has no CTO journey caption test id.
- CTO demo tour still works when that pack is on.
- No thirteenth env flag.

## Constraints

- Do not delete the CTO tour feature.
- Do not collapse review tabs.
- Do not revert `isBuyerPolishedOperatorShellEnv()` to `return true`.
