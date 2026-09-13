# IR-009 — Palette host default-focus first finding

**Wave:** inhabit remain leftovers (**IR**). **Not wave 35.** **Cluster:** keyboard. **Depends on:** IH-060, IR-008.

Do not implement from the remain index. Implement only *What to build*.

## Goal

On Working inhabited findings, command-palette finding work actions (accept / remediate / reject / next / prev) start from the first finding when nothing is focused. Palette ranking already puts work actions first (IH-060).

## Why

`CommandPaletteActions.tsx` inventory: `defaultFocusFirstFinding: false`, `paletteWorkActionsFirst: true`, owner IH-060. Ranking without a default work object still requires a mouse click before Alt+1 from the palette.

## Context

- `components/CommandPaletteActions.tsx` · `sortInhabitFindingsPaletteHandlerActions` · `dispatchCommandPaletteHandlerAction` · `pathIsWorkingInhabitedFindingsRoute` · IR-008 hook

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. When Working + inhabited findings route, palette finding work actions call the same start-from-first helper as IR-008 if no `[data-finding-id]` is focused. Reuse `focusAdjacentFindingCard`. Do not steal dialog focus. Do not reorder IH-060 work-before-nav ranking except to keep finding next/prev after the three dispositions if needed for the default-focus path.
2. Do not add presence. Do not make palette nav hrefs precede work actions on this route.
3. Flip the CommandPaletteActions inventory `defaultFocusFirstFinding` to true, owner `IR-009`. Focused Vitest on inhabit palette rank file plus a host test that dispatch-without-focus focuses first card.

## Acceptance criteria

Done when *What to build* is true and any tests named there pass. Working vs Guided split holds unless this prompt says otherwise. Nested review workspace tabs stay a full strip. Emit LLM judge stays default off. Real finalize judge stays default on unless this prompt is an explicit skip. Host Mode stays Simulator. 300s undo stays 300s.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip when a job is open.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **Do not** restore system-wide breadcrumbs (**TB-2090**).
- Emit `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudge` stays **false** unless this prompt's *What to build* says otherwise.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- User-facing execute labels are **Record** / **Practice** (ADR **0097**). Stored tokens stay `"career"` / `"rehearsal"`. Do not resurrect **Career blocked**.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** re-run SG-001–081, LY-001–120, CG, SN, LN, LW, MG, DI, CE, DW, RP, or **IH-001–080** product bodies except as a numbered leftover named in Context. **Do not** remount the CE Sketch runner. **Do not** invent `GET /v1/runs/{runId}/progress`. **Do not** draft-diff Compare.
- **Do not** start wave 35 or paste an 80-prompt pack. This file is one inhabit-remain leftover.
- Leftover owner: named in Context. **Do not re-implement that file.** Implement only *What to build*.
- If mounting start-honesty wrappers, do **not** call `useWorkspaceMode()` inside a wrapper that must render null without a provider (`WorkingExecuteStartHonestyNotices` pattern).
