# WS-18 — Idle timeout preserves dirty livelihood forms

Do not lengthen 300s mutation undo. Do not store secrets in localStorage. Do not skip idle timeout.

## Goal

Before Working idle clear, persist **dirty livelihood form snapshots** already covered by document guards (disposition rationale, draft fields, policy pack edits) into the same recovery mechanism drafts use, then restore after re-auth — not only return URL + scope (`idle-desk-restore.ts`).

## Why

Idle restore rehydrates navigation. Unsaved disposition text dies. All-day users hit the 4h Working ceiling in long ARBs.

## Context

- `idle-desk-restore.ts`
- `SessionIdleTimeoutGuard.tsx`
- `use-livelihood-document-guards.tsx`
- PT-13 / PT-18 leftovers

## What to build

1. Extend idle persist to include dirty guarded field snapshots keyed by route + entity id.
2. Rehydrate after session-expired sign-in when returnUrl matches.
3. Vitest: disposition dirty text round-trips idle persist mock.
4. Do not persist tokens in those snapshots.

## Acceptance criteria

- Dirty finding rationale survives idle → sign-in on Working.
- Scope restore still works.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

