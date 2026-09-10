# FP-24 — Wave close audit — inspect/bulk CAS is fail-closed, not labeled

Do not re-run FP-01–23. Evidence-only.

## Goal

Write `docs/architecture/FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md`:

| Prompt | Shipped? | Evidence (file + test name) | Residual |
|--------|----------|-----------------------------|----------|

Mark **shipped** only if:

1. Inspect submit + mark-remediated send the token (FP-08).
2. 409 panel + retry adopts winner (FP-06/07).
3. Keyboard undo + restore send the token (FP-10/11).
4. Call-site ratchet is green (FP-12).
5. Bulk SQL + UI send per-finding tokens; null expected after pointer 409s (FP-20).
6. Contract PA table no longer says both HTTP calls succeed (FP-22).

Link from `docs/architecture/README.md` and `FINDING_POINTER_CAS_COMPOSER_PROMPTS.md` status line.

Residuals **out of wave**: LP-19 401 resume; stale findings-queue refetch; stop-analysis confirm; live presence.

Optional: Vitest that `.cursor/prompts/finding-pointer-0{1-9}*.md` and `10–24` files exist (file inventory only).

## Why

Without a close audit, the next inspect refactor will omit the token again.

## Context

- `WORKING_SEAT_ACCEPTANCE_2026-09-07.md` template
- FP-01 inventory

## What to build

1. Acceptance markdown + README pointer (if README pointer was not added with the prompt set PR).
2. Residuals named out of wave (LP-19, queue staleness).

## Acceptance criteria

- Audit does not claim LP-19, live presence, or insight density closed.
- If inspect save can still omit the token when history has a version, wave is **not** marked shipped.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0076 body except Related pointers. Do **not** add a new ADR. FP-22 may correct the stale PA table in `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`.
- **Do not** implement LP-19 (401 resume / idempotency replay) or LP-20. This wave only attaches the CAS token and 409 recovery.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK, LP except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- Prefer **no schema change** — `RowVersionStamp` already exists on `dbo.FindingCurrentDispositions`. SQL stays in the single DDL file per database plus a numbered migration only if a schema change is unavoidable.
