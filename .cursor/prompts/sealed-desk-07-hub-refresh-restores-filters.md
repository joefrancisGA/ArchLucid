# SD-07 — Hub refresh restores filters and sort

**Do not fork WA-15** (review-detail workbench column / findingId / scroll). **Do not fork AD-07 / AD-12** (sticky identity columns). This file is **list hubs**: Reviews hub and governance findings/approval queues still drop filter/sort/page on F5 because that state is component-only.

## Goal

Working-mode `/architecture/reviews` and `/governance/findings` (and the approval queue if it has filters) encode filter, sort, and page in the URL (preferred) so refresh returns the architect to the same scan. Do not use `localStorage` as the only SoT. Do not persist secrets in the query string.

## Why

All-day queue work is F5-tolerant. Casual SPAs reset the inbox. WA-15 fixed the open document; the career day is also the hub. Losing “Needs attention + sort by updated” after a token refresh is how people re-work the wrong row.

## Context

- Reviews hub table filter/sort state (`ReviewsHubInventoryTable` or equivalent)
- Governance findings list filters
- Pattern: `review-findings-visibility-url.ts` / Wave 39 filter URL sync (`#1588`) — **reuse**, do not invent a second query language
- AD-07 sticky title/status — keep; this is restore, not stickiness

## What to build

1. Identify hub filters that are React state only. Lift to search params using the existing filter-URL helper if one exists for shell/onboarding.
2. Restore on load; `replace` vs `push` should not spam history on every keystroke (debounce or apply-on-blur already used elsewhere).
3. Vitest: hub URL with filter params hydrates the table without an empty first paint of the unfiltered set if that flash already has a pattern to copy.
4. Guided may keep simpler hubs; Working must restore.

## Acceptance criteria

- Refresh on a filtered Reviews hub returns the same filter/sort.
- Governance findings queue likewise.
- Desktop review-detail tabs unchanged. No More menu.

## Constraints

- Do not persist tokens or tenant ids that are already in the session.
- Do not restore breadcrumbs (**TB-2090**).
- Do not start a dev server.
