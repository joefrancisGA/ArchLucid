# RP-024 — Wave close audit — Record and Practice on Working chrome

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** close. **Depends on:** RP-001–RP-023.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Write `docs/architecture/RECORD_PRACTICE_ACCEPTANCE_2026-09-12.md` (date = actual close). Evidence per cluster. Mark shipped only if done tests in the index are true.

## Why

Without a close audit, Career returns on the next honesty strip.

## Context

- LIVELIHOOD_PROOF_ACCEPTANCE template · architecture README pointer

## What to build

1. Acceptance markdown + README status line.
2. Done tests: top bar Record | Practice; no user-visible Career on Working chrome, blocked dialogs, banners, help H1, CLI help; stored token still career; host Mode default unchanged; Guided still hides the chooser; rehearsal watermarks still fire; Career+Simulator finalize still blocked.
3. Residuals: G-REAL-06; ADR 0078 filename; engineering family names.
4. Do not claim CPA SOC 2 or live first review.

## Acceptance criteria

Audit does not mark shipped if a Working screenshot still shows Career as a chip or blocked-state subject.

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
- Leftover owner: CG-100 / DW-024 close-audit pattern. **Do not re-implement that file.** Implement only *What to build*.
