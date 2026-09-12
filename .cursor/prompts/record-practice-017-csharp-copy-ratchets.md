# RP-017 — C# ratchets that pin user-facing Career copy

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** ratchet. **Depends on:** RP-005, RP-010, RP-011, RP-014.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Retarget C# architecture tests that assert **user-facing** Career / Rehearsal literals in UI/help/CLI modules. Tests that pin ADR 0086/0091 historical text, stored token `"career"`, or file names stay.

## Why

Ratchets will fail the copy PRs, or worse keep the old word forever if left on Career.

## Context

- `CareerGravityCg097HelpCenterSearchDoorTermsArchitectureTests.cs` (aliases — RP-012)
- `CareerGravityCg015SimulatorCloneRehearsalBannerArchitectureTests.cs`
- `CareerGravityCg030*` simulator-complete honesty
- `ArchitectureSpineAs076CareerVsRehearsalDoorsArchitectureTests.cs` — keep ADR 0086 Career
- `ArchitectureSpineAs082*` help
- `ArchitectureSpineAs083CliTryRealVsRehearseArchitectureTests.cs`

## What to build

1. Grep `ArchLucid.Architecture.Tests` for Career in combination with UI file paths.
2. Split: historical ADR quotes vs UI copy. Only UI copy retargets.
3. Scoped `dotnet test` on the touched test project filter.
4. Do not rename the test **classes** (RP-023).

## Acceptance criteria

Architecture tests pass. ADR 0086 still contains Career. Chooser copy tests do not require Career.

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
- Leftover owner: CareerGravityCg* / ArchitectureSpineAs076 / As082 / As083 tests that pin UI strings. **Do not re-implement that file.** Implement only *What to build*.
