# DR-13 — Working lists are dense, virtualized, and restore last-visit filters

**Do not collapse desktop review tabs.** **Do not fork** TB-935 history — implement leftovers on **governance findings** and **review findings** card stacks.

## Goal

Working `/governance/findings` and review-detail findings **list mode** default to `EnterpriseTable` (or existing dense list-kind) with virtualization for large packages. Card stacks remain available as a view toggle, not the default.

Persist the findings filter query (classification band, severity, engine, text) as **last-visit** for that run/list (server preference if a prefs API exists; otherwise URL is canonical and Home/hub “Continue” uses it). `ReviewsListReturnStateTracker` already returns to the reviews list — extend the same idea to findings filters (TB-2150 adjacent, do not fork that prompt if it exists).

Show **Showing N of M** whenever a filter hides rows (CA-40 leftover honesty if not already on this grid).

## Why

Hundreds of findings on cards is a demo. Professionals scan a table, filter, leave for a meeting, and return to the same queue.

## Context

- `GovernanceFindingsList.tsx` / `GovernanceFindingRow.tsx`
- Review findings toolbar URL helpers
- `EnterpriseTable`
- TB-1646–1650 density conventions; TB-2142 First Load JS — do not grow the review route bundle; lazy-load the card view

## What to build

1. Default view = table on Working; Guided may keep cards.
2. Virtualize rows (existing virtualization primitive if present).
3. Last-visit filter restore + N of M.
4. Vitest: 50-row fixture renders table; filter round-trip after remount.

## Acceptance criteria

- Working default is scannable at 50+ findings without loading a second page of chrome.
- Hidden-by-filter count is visible.

## Constraints

- Carbon density. No ghost Button. Keyboard Alt+J/K still moves the focused row.
