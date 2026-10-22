# RP-001 — ADR 0097: Record and Practice user-facing labels

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0097-record-and-practice-user-facing-labels.md` (Proposed). Decision: on Working, the user-facing execute labels are **Record** and **Practice**. Stored tokens stay `"career"` / `"rehearsal"`. The old word **Career** was doing three jobs (toggle name, honesty adjective, blocked-state subject); 0097 splits them. Does not rewrite ADR 0086 doors or ADR 0091 gravity. No host Mode flip. No G-REAL-06.

## Why

A human reading **Career** next to **Career blocked** hears a verdict on their job, not a label on a sealed review record. Owner 2026-09-12: Record / Practice. Working is already the seat name and cannot be reused.

## Context

- ADR 0086 (doors) · ADR 0091 (Career default day) · ADR 0078 (career artifact honesty — keep title)
- `docs/architecture/adrs/README.md` (next number **0097**; **0093–0096** are reserved by LN/MG/DI/DW)
- `docs/architecture/adrs/template.md`
- Index glossary in `.cursor/prompts/record-practice-00-index.md`

## What to build

1. Write ADR 0097 with numbered Decision, Trade-offs, Constraints, Expected impact (include **security** — authority-borrowing in ARB packets must stay forbidden; the rename must not weaken rehearsal watermarks or Career+Simulator finalize blocks), Consequences.
2. Quoteable glossary (copy the index table): toggle **Record** / **Practice**; adjective **record-complete** / **sealed-record proof**; blocked **Sealed record blocked** / **This host cannot produce a sealed record**; aria **Review type**; switch CTA **Switch to Practice**.
3. Forbidden user-facing labels: Career, Working, Production, Real, Live, Standard, Normal, door (in chrome).
4. README row. Proposed in this PR is OK.
5. Guard test: file exists; `WorkingCareerRehearsalDoorValues.Career` remains `"career"`; host Mode default unchanged.
6. Do **not** change UI copy in this prompt (RP-003+).

## Acceptance criteria

PR review can quote 0097 for “what does the chip say?” → Record / Practice, and “did we rename the wire token?” → No.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** rename stored tokens `"career"` / `"rehearsal"`, API/DTO field names, SQL columns, webhook JSON keys, localStorage keys, or test ids that encode those tokens. User-facing copy only.
- **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a door label. **Working** is workspace mode; **Dev** is the environment chip; Real/Simulator/Fallback is host Mode.
- **Do not** rewrite ADR 0086 or 0091 bodies. ADR 0097 supersedes **user-facing labels only**. Honesty gates stay.
- Leftover owner: ADR 0086 / 0091 — do not rewrite those bodies. **Do not re-implement that file.** Implement only *What to build*.
