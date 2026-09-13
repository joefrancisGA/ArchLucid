# IR-004 — Working inspect carries architecture identity

**Wave:** inhabit remain leftovers (**IR**). **Not wave 35.** **Cluster:** document. **Depends on:** IH-004, IH-020.

Do not implement from the remain index. Implement only *What to build*.

## Goal

Working finding inspect is architecture-id-known: nested findings inspect, or the inspect route carries `architectureId` and Back returns to architecture-nested findings. Inspect is a panel/inspector, not a second product.

## Why

`INHABIT_FINDINGS_EDITOR_SURFACE_ROWS` still marks review-detail finding inspect `architectureIdKnown: false`. An all-day operator will use the fastest editor. If inspect is the fast path without architecture identity, inhabit is a landing preference and career decisions land off the document.

## Context

- `/architecture/reviews/{reviewId}/findings/{findingId}` · `governanceFindingInspectHref` · `FindingDetailPageView.tsx` Working back resolver (already `returnsToArchitecture: true` when architecture known) · IH-020 leftover · HelpDrawerContent non-modal pattern

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. When Working and `ArchitectureId` is known, inspect hrefs include that id (nested findings inspect preferred). `architectureIdKnown` on the inspect inventory row becomes true. Prefer the existing non-modal triage/inspect panel on the inhabited document over a peer route that drops identity.
2. Do not delete the inspect route. Do not hover-only inspect. Do not architecture-scope the peer governance queue (IR-015). Full review-tab strip if inspect stays inside the job inspector.
3. Update `INHABIT_FINDINGS_EDITOR_SURFACE_ROWS` owner to `IR-004` for inspect. Extend inhabit leak / inspect-back guards. Focused Vitest on Working inspect href + back target.

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
