# FD-10 — Guided seats get an opt-in Working invitation, not an auto-switch

**Do not fork CD-08** for Guided lock-map vs palette. **Do not auto-switch** stored Guided users to Working. This file is unique: after the seat has a committed package, Guided never offers Working as a **choice**. The evaluator product becomes permanent.

## Goal

Guided Working-mode preference stays stored. After first committed package (workspace-state, ADR 0067 §6), show a one-line invitation: this seat can use the Working desk (full Operate nav, no first-session hide). Primary CTA is opt-in (`setWorkspaceMode("working")` or existing preference API). Dismiss is sticky for the account, not only `localStorage` if an account-scoped prefs helper already exists (WA-14 / RS-10). Never flip mode without the click.

## Why

Progressive disclosure is a pilot-conversion bet. A governance lead who evaluated in Guided thinks Insights/Governance do not exist. CD-08 makes the Guided map honest. This file is the graduation **offer** so the livelihood desk is reachable without violating the no-auto-switch rule.

## Context

- `archlucid-ui/src/lib/workspace-mode.ts` / `WorkspaceModeProvider`
- `skipProgressiveNavDensity` — Working only
- Account-scoped prefs (WA-14 / RS-10) — reuse if present; otherwise session + documented limit
- First committed package detector already used by first-session nav
- ADR 0067 §6 workspace-state emphasis

## What to build

1. Working invitation callout on Guided Home (or Overview) only when `evalChrome` and at least one committed package. Copy: Working shows Insights/Governance now; Guided keeps the shorter first-session map. No sample CTA.
2. Opt-in sets Working. Dismiss does not set Working. Do not show on Working.
3. Vitest: Guided + zero commits → no invitation. Guided + committed → invitation. Clicking opt-in would call the existing setter (test the handler). Working fixture has no invitation.

## Acceptance criteria

- Stored Guided is never flipped by load or first commit alone.
- A Guided user with a sealed package can reach Working in one click.
- CD-08 lock honesty still applies until they opt in.

## Constraints

- **Forbidden:** auto-switch on commit, login, or feature flag.
- Do not collapse review tabs.
- Do not implement **M-90**.
