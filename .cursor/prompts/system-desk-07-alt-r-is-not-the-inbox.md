# SY-07 — Alt+R on Working never opens the reviews hub

Do not fork AO-43 desk shortcuts. This is the global atlas leftover that AO-50 did not ratchet.

## Goal

Working `SHORTCUTS` entry `alt+r`:

- If last-open / in-scope architecture id exists → `architectureIdentityPath(id)` (desk job list is on that page; optionally `#reviews`).
- Else → `ARCHITECTURES_LIST_PATH` (portfolio), **never** `REVIEWS_LIST_PATH`.

Inbox remains a **sidebar** destination labeled Inbox (SY-56). Guided may keep Alt+R → reviews hub.

## Why

Alt+R is the strongest remaining teacher that Monday morning is a job list. AO put Start on the architecture and left the packages shortcut pointed at `/architecture/reviews`.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/hooks/useShortcutNavigation.ts`
- `archlucid-ui/src/hooks/use-working-start-href.ts`

## What to build

1. Working-aware href resolver for Alt+R (reuse last-open cache).
2. Vitest: Working + last-open → identity path; Working + empty → architectures list; Guided → hub allowed.
3. Update `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` in the same PR (or SY-14 if you only change code here — prefer same PR).

## Acceptance criteria

- AO-50 still passes.
- New test fails if `SHORTCUTS` alt+r `route` is hardcoded to `REVIEWS_LIST_PATH` without a Working resolver.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip. A desk **command bar** or nested tool route is not a More menu for those tabs.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0079** (desk is the work surface) and **Accepts ADR 0077** when the locator already shipped.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run AO-01–50, CA-01–50, DA-01–12, PC-01–13, DR-01–16, FC-01–80, or LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

