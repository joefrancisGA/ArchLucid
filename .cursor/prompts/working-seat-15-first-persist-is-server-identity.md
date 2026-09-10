# WS-15 — First persist is a server architecture identity, not localStorage-as-saved

Do not remove interrupt recovery. Do not start a review on first keystroke. Keep autosave after id exists.

## Goal

Working new-draft: as soon as the draft is saveable (existing integrity pass), **create the server draft + architecture identity** (ADR 0074 ensure-on-save). `localStorage` recovery is for offline / crash **before** that create succeeds, with copy that says **this browser, not saved to your account** until the server id exists.

## Why

`architecture-new-draft-recovery.ts` plus copy that unsaved typing is kept on this browser until first save. Cross-device login loses hours.

## Context

- `architecture-new-draft-recovery.ts`
- `use-architecture-draft-autosave-persist.ts`
- ADR 0074 / CA-06 ensure-on-save leftover

## What to build

1. Lower the bar to first server create on Working (still not empty spam — keep min integrity).
2. Copy: distinguish Recovered locally vs Saved to account.
3. Vitest: saveable Working draft calls create; recovery key cleared after server id.

## Acceptance criteria

- Working saveable draft gets an architecture id without a separate Save click if autosave already exists — or Save is explicit but not described as saved before 2xx.
- Offline still uses local recovery with honest copy.

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

