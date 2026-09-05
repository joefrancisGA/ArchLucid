# IS-11 — Meeting elicitation is a job, not a query flag

**Do not fork FD-01** (yes/no/another-question loop) or PT-15 (`ReviewPresenterSurface`). The loop shipped. This file is **discoverability**: Working architects cannot be expected to append `?presenter=1`. Presenter is a first-class action from the open review (and optionally print). Token keepalive stays PT-19 / ADR 0059 (IS-15).

## Goal

Working review header (and command palette) exposes **Present**. It sets the existing `presenter=1` behavior. Guided may hide it. Do not add `?view=meeting`. Do not reuse `BuyerCtoDemoTourOverlay`. Desktop tabs remain in the non-presenter strip.

## Why

R4’s conference-room persona is the livelihood sitting posture. A secret query flag is an engineer overlay. The mediator should find Present the way they find Finalize.

## Context

- `ReviewPresenterSurface.tsx`
- `RunDetailPresenterElicitationBridge` (FD-01)
- Review header / command bar
- `command-palette-actions.ts`
- `session-idle-timeout.ts` — do not shorten 4h Working

## What to build

1. Working review command bar: **Present** control (button or menu) that navigates to the same URL with `presenter=1` (or toggle). Palette row “Present this review” in the This-review group.
2. Exit presenter returns to the same review without losing finding selection if IS-13/WA restore exists.
3. Do not mount demo hand-the-keyboard overlay.
4. Vitest: Working header shows Present; Guided does not by default; `presenter=1` still the only flag; FD-01 three actions still render.

## Acceptance criteria

- A mediator can enter the R4 loop from the review they already have open without editing the URL.
- Non-presenter Working tab strip is not collapsed behind More.

## Constraints

- Do not implement **M-44**.
- Do not use bare `E` as a shortcut.
