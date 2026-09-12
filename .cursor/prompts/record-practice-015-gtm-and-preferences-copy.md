# RP-015 — GTM doc, preferences, and one-sentence gravity

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-011.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Buyer/operator docs and preferences copy: Record / Practice. One-sentence Working gravity: this desk is Record work unless you switch to Practice.

## Why

MG-003 shipped `This desk is Career work unless you switch to Rehearsal.` That sentence is now the threat.

## Context

- `docs/go-to-market/CAREER_VS_REHEARSAL_WORKING_DOORS.md` (keep filename; retarget body)
- Preferences workspace-mode copy (MG-005 leftover: two controls, new labels)
- In-product help one-liner (MG-003)

## What to build

1. GTM doc H1 can stay as a historical filename; visible title and sections: Record / Practice. Career is the sealed-record path → Record is the sealed-record path.
2. Preferences: Workspace mode = Working vs Guided. Review type = Record vs Practice on Working only.
3. One sentence + Practice exception. Guided separate sentence.
4. No GitHub blob.

## Acceptance criteria

Preferences and the GTM doors doc do not present Career as a chip label.

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
- Leftover owner: MG-003 / MG-011 / CAREER_VS_REHEARSAL_WORKING_DOORS.md. **Do not re-implement that file.** Implement only *What to build*.
