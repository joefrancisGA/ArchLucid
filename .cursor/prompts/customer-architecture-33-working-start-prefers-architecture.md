# CA-33 — Working start / Alt+N prefers architecture

**Do not fork IS-03** except a one-line call. **Do not** put draft id in the identity segment.

## Goal

`resolveWorkingStartHref` / `useWorkingStartHref` / Alt+N:

1. In-flight **review** still wins (do not babysit a tab — but resume the running job).
2. Else last-open **architecture** identity desk.
3. Else new architecture bootstrap (`ARCHITECTURES_NEW_PATH`).
4. Do not resolve “continue last draft” as `/architectures/{draftId}` after CA-20.

## Why

Start that opens a draft editor as if it were the system returns the lie. Start that opens a wizard on a paying seat is evaluator chrome.

## Context

- `working-start-route.ts`
- `use-working-start-href.ts`
- `shortcut-registry.ts` Alt+N
- Desk continuity prefs (IS-13) — do not fork; consume last-open architecture if you add a field

## What to build

1. Resolver + tests: in-flight review > last architecture > new.
2. Guided Alt+N may stay intake wizard (ADR 0067).

## Acceptance criteria

- Working Alt+N never uses `architectureDraftPath(draftId)` as the identity URL.
- In-flight review still deep-links to the review (ADR 0072).

## Constraints

- Do not auto-switch stored Guided users.
- Do not implement BFF keepalive (LK-07).
