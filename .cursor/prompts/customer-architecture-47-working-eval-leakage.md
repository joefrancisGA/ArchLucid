# CA-47 — Working eval leakage off the architecture hub

**Skip if** DA-09 already shipped **and** the identities hub has no demo/wizard launchers. **Do not fork LK-15** CI identity.

## Goal

Working **Architectures** hub and desk:

1. Hide `CompareDemoQuickPick` / sample compare.
2. Hide first-session wizard launcher / dual start products (ADR 0067 stays on Guided).
3. CTO/demo captions stay off the paying desk (FD-08 leftover pattern).

## Why

A named architecture object next to “try the demo compare” is still an evaluator product.

## Context

- DA-09 (do not paste)
- `ArchitecturesHubBuyerChrome.tsx`
- `useProductionEvalChrome` / `useProductionDeskChrome`
- CA-25 / CA-30

## What to build

1. Gate buyer/demo chrome on the architectures surfaces.
2. Vitest: Working fixture has no demo compare; Guided may keep it.

## Acceptance criteria

- Working hub primary actions: New architecture, open identity — not wizard/demo.
- Guided teaching chrome remains on Guided.

## Constraints

- Do not delete the buyer-polished demo suite.
- Do not auto-switch Guided → Working.
