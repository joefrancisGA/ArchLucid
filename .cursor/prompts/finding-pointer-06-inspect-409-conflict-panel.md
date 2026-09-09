# FP-06 — Inspect 409 mounts `FindingDispositionConflictPanel`

Do not invent a second conflict UI. Reuse `FindingDispositionConflictPanel` (RS-11 / keyboard).

## Goal

When inspect `submitDisposition` or `submitExplicitRemediation` throws `httpStatus === 409`, parse with `readFindingDispositionConflictDetail` (same as keyboard ~L396–399) and render `FindingDispositionConflictPanel` on the inspect disposition form.

Reload current = `reload()` (existing history fetch). Dismiss clears conflict state.

Keep field values (rationale, restatement) — do not wipe the form on 409.

`resolveMutationError` generic text is **not** sufficient once a conflict detail exists; prefer the panel.

## Why

Keyboard already explains “another operator recorded X”. Inspect currently sets `dispositionInlineSaveError` from a generic mapper — the architect cannot reload the winner and amend.

## Context

- `FindingDispositionConflictPanel.tsx`
- `finding-disposition-conflict.ts`
- `FindingInspectDispositionForm.tsx` / `FindingInspectDispositionControls.tsx`
- Keyboard catch path `FindingKeyboardTriageHost.tsx`

## What to build

1. Conflict state on the dispositions hook; pass through stickiness panel → form.
2. Mount panel with `onReload` calling `reload()` then clearing busy.
3. Vitest: mock 409 problem with `currentDisposition` → panel test id appears.

## Acceptance criteria

- 409 with parseable detail → panel, not only a toast.
- Unparseable 409 still shows inline error (existing `OperatorMutationInlineError` path).
- Form fields remain.

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
