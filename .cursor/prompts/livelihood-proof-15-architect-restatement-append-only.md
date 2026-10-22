# LP-15 — Architect restatement is append-only (not finding-comment chat)

Do **not** add comment threads, presence, or mutate sealed finding `Message`.

## Goal

Disposition (and record correction) already carry notes. Add one **append-only architect restatement** field on the finding review event / inspect payload: the expert’s wording of what they will tell the ARB. It is **not** the engine finding text. Career exports include restatement in the human-judgment section, labeled inferred/asserted only if already on the trail; otherwise “operator restatement — not sealed engine prose.”

This is the WS-19 / R13 leftover: judgment leaks to Word because the only challenge verb is disposition enum + free-text notes that do not travel on sponsor PDF.

## Why

Professionals cannot correct AI wording in the sealed payload (correct). They still need a durable sentence that is **theirs** without inventing chat.

## Context

- `FindingDispositionService`, `FindingInspectDispositionForm.tsx`
- ADR 0076 current pointer — restatement is on the event, not a parallel mutex
- ADR 0078 export honesty — restatement is not evidence-backed unless cited
- WS-19 open questions stay on the architecture draft (do not fork)

## What to build

1. Optional `ArchitectRestatement` (or existing notes column if unused) on disposition POST; append-only trail.
2. Inspect UI: one textarea, livelihood-guarded (LP-11).
3. Sponsor/receipt export: include restatement with honesty label.
4. Vitest + C#: cannot PATCH sealed `Message`; restatement does not change finding title.

## Acceptance criteria

- ARB packet can show the architect’s sentence without rewriting the engine finding.
- No comment-thread UI.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
