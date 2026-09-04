# CD-08 — Guided locked nav is honest; palette matches the sidebar

**Do not fork WA-02** for Working one-start. **Do not auto-switch Guided users to Working.** This file is **Guided first-session hide**: Insights / Governance / Reports can be absent from the sidebar (`filterNavGroupsForFirstSessionPilotMode`) while the command palette still lists those destinations. There is no persistent “what’s locked and why” for a paying Guided seat.

## Goal

Guided (eval chrome): if a nav group is hidden by first-session / role-density, (1) a visible one-line lock reason exists (existing Operate unlock hint is enough if it is accurate), and (2) command palette rows for those hrefs are omitted or disabled with the same reason. Working already skips first-session hide — do not re-lock Working. Palette ⊆ visible sidebar for that mode.

## Why

Progressive disclosure is a guided-pilot bet. A livelihood failure is a dual map: the sidebar says the job does not exist; Ctrl+K says it does. Governance-leads in Guided think the product lacks governance.

## Context

- `archlucid-ui/src/lib/role-shaped-nav-density.ts` — `filterNavGroupsForFirstSessionPilotMode`
- `archlucid-ui/src/hooks/useOperatorShellNavRows.ts`
- `archlucid-ui/src/lib/resolve-visible-command-palette-actions.ts`
- `archlucid-ui/src/lib/usability/operate-advanced-features-disclosure.ts`
- First-pilot unlock vocabulary — reuse, do not invent a third unlock system
- Working: `skipProgressiveNavDensity` stays true

## What to build

1. Palette visibility for Guided uses the same group filter as the sidebar (or marks rows unavailable with the lock sentence).
2. When Guided hides Operate groups, show one honest lock line (existing hint OK) — not a sample CTA.
3. Vitest: Guided phase-0 fixture — palette does not navigate to a hidden Insights href as a live peer. Working fixture still lists Graph/Governance. No desktop **More** menu.

## Acceptance criteria

- Guided users see one map.
- Working nav density is not reduced.
- Stored Guided preference is not flipped to Working.

## Constraints

- Do not re-enable unlock phase as a Working sidebar gate.
- Do not collapse review tabs.
- Do not implement **M-90**.
