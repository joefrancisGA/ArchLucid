# LS-11 — List disposition disable reason is not a native `title`

**Do not fork FD-02** (density band `title` removed) or WA-18 (list Accept/Remediate/Reject). This file is the leftover: `FindingListDispositionRowActions` still sets `title={blockedReason}` on disabled buttons. Native `title` is mouse-only; keyboard and touch never see why Accept is dead. Design system already bans help-in-`title`.

## Goal

When list disposition is blocked, the reason is visible next to the buttons (the `role="status"` paragraph already exists when `blockedReason !== null`). Remove `title={blockedReason}`. If blocked and the paragraph is easy to miss in compact rows, keep the paragraph; do not restore `title`. Disabled **why** must not live only in a tooltip.

## Why

All-day triage is keyboard-heavy. A livelihood write that fails silently except on hover is a casual SPA. FD-02 already killed this primitive on the density band.

## Context

- `archlucid-ui/src/components/governance/findings/FindingListDispositionRowActions.tsx` (`title={blockedReason ?? undefined}`)
- `UI_DESIGN_SYSTEM.md` banned `title` for help; truncation `title` is a separate TB-2147 problem — this is **disable reason**, which must be visible
- `eslint-rules/title-attribute-legacy-surfaces.mjs` — add this file if it was baselined
- Disposition still uses `ConfirmationDialog` on apply — do not remove confirm

## What to build

1. Delete `title` props on those three buttons.
2. Ensure `blockedReason` text is rendered for compact and default; unique accessible name on the status line.
3. ESLint: this surface must not be on the title-attribute allowlist.
4. Vitest: blocked fixture exposes the reason in accessible name/text; query `title` attribute absent.

## Acceptance criteria

- Keyboard-only user can learn why Accept is disabled without a mouse.
- Confirm-on-apply remains.
- No new hover-only help.

## Constraints

- Do not put interactive content in a tooltip.
- Do not change `typed-engine-protected` gate (IS-05).
- Do not collapse tabs.
