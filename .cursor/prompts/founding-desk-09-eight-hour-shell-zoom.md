# FD-09 — 200% zoom on the shell does not invent a More menu

**Do not fork WA-24** for review-detail zoom / reduced motion. **Do not fork AD-12** for 1280px sticky identity columns. This file is leftover **shell**: sidebar + desktop review tab strip at 200% zoom / 400% text. Overflow must wrap or scroll. It must **not** hide tabs behind More.

## Goal

Working full shell at 200% zoom: primary nav remains reachable (scroll the sidebar); desktop review tabs stay a full strip (wrap or horizontal scroll with visible overflow, not a More menu). Reduced-motion already respected on review-detail stays. No new density mode.

## Why

People work eight hours, often with OS zoom. Collapsing tabs was explicitly rejected. The failure mode is clipped nav or a hidden tab the architect memorized.

## Context

- `.cursor/rules/no-collapse-workspace-tabs.mdc`
- `archlucid-ui/src/components/AppShellClient.tsx` sidebar classes
- `ReviewWorkspaceTabStrip.tsx` / `resolve-review-detail-visible-tabs.ts` — `moreTabIds` stays empty
- WA-24 review-detail zoom tests — extend or add a shell fixture
- `OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS`

## What to build

1. Working 200% fixture (or equivalent CSS zoom in Vitest/Playwright if a pattern already exists from WA-24): sidebar content is not `overflow: hidden` clipped without a scrollport; tab strip does not render `ReviewWorkspaceMoreTabsMenu`.
2. If the strip must scroll, keep all tabs in the accessibility tree and visible via scroll — not a disclosure labeled More.
3. Vitest or existing zoom test: `moreTabIds` empty; no More menu test id.

## Acceptance criteria

- 200% Working review-detail still shows every authorized tab without More.
- Sidebar destinations remain keyboard-reachable.
- Mobile `<select>` more-sections may stay.

## Constraints

- **Forbidden:** desktop More / overflow menu for review tabs.
- Do not change tab ids or labels.
- Do not implement AT user-testing programs.
