# RP-023 — Explicit skip: engineering family names stay

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** out-of-wave. **Depends on:** RP-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Explicit skip. Do **not** rename prompt families, C# test class names, ADR 0078 title, or internal comments that say career artifact / livelihood gravity. Those are engineering vocabulary.

## Why

Renaming CG-001–100 and CareerGravityCg* tests is churn with no user benefit. Keeping internal Career next to UI Record is the point of ADR 0097.

## Context

- `.cursor/prompts/career-gravity-00-index.md` · `ArchLucid.Architecture.Tests/CareerGravity*`

## What to build

1. Do not rename those files.
2. New comments may say ‘user-facing Record (ADR 0097)’ when a module exports both a token and a label.

## Acceptance criteria

No prompt-family or test-class rename in this wave.

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
- Leftover owner: career-gravity / false-confidence-career / career-desk prompt families. **Do not re-implement that file.** Implement only *What to build*.
