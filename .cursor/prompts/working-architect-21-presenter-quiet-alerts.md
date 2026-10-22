# WA-21 — Presenter mode quiets toasts and ops banners

**Do not fork LD-13, LI-14, or RS-06** for the mediator loop, token keepalive, or demo/paying ops inversion. Presenter exists. This file is **the room still loses the projector to toasts, LLM budget pills, and degraded-Redis banners**.

## Goal

When `presenter=1` (or the shipped equivalent) is on in Working, suppress auto-opening toasts, teaching coaches, sample CTAs, and golden-path ops banners. Keep TB-2155 errors that block the current question (save failed / token refresh failed) as **inline** recovery, not a toast covering the three answers. Skip link + main landmark stay.

## Why

Founding use is one question and three actions. A Service Bus toast is how you lose the business analyst. Casual SaaS always banners. Livelihood meetings are quiet.

## Context

- `readPresenterModeFromSearchParams` / review-detail presenter
- Toast host / `showError` — system failures may become inline in presenter
- LD-10 / RS-06 ops banners
- `BuyerCtoDemoTourOverlay` — must not mount
- Session idle 4h Working — keep

## What to build

1. Presenter layout: no tour, no shortcut coach, no sample CTA, no COGS/LLM header, no Redis/Service Bus first-line banner.
2. Blocking errors: inline three-line contract on the mediator surface.
3. Vitest: presenter=1 does not render the demo overlay or ops hero; Guided non-presenter unchanged.

## Acceptance criteria

- A mediator can run yes/no/another-question without a toast covering the actions.
- Token keepalive from LI-14 still holds.
- Desktop review tabs are not collapsed; presenter is a layout, not a More menu.

## Constraints

- Do not disable session timeout globally.
- Do not reuse hand-the-keyboard / CTO demo overlay.
- Do not implement GTM first-session cohorts.
