# IR-002 — Core pilot steps inhabit the architecture

**Wave:** inhabit remain leftovers (**IR**). **Not wave 35.** **Cluster:** dual-spine. **Depends on:** IH-012, IH-069.

Do not implement from the remain index. Implement only *What to build*.

## Goal

Working core-pilot steps no longer teach create → execute on review-detail → finalize on review-detail → inventory → ROI → audit CSV → findings-last. The paying afternoon is inhabited findings on the open architecture. Review-detail is the job inspector.

## Why

`lib/core-pilot-steps.ts` still maps Home/diagnostics to `/architecture/reviews` for execute, finalize, and findings. Findings are step 7. That trains a seat-licensed operator into the child job as the product and fights ADR 0100 every first week.

## Context

- `lib/core-pilot-steps.ts` · `INHABIT_WORKING_HOME_PIPELINE_ROWS` (teachesPipeline: true, owner IH-069) · `core-pilot-help-working-examples.test.ts` SG-056 · IH-070 Guided may keep eval

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. Rewrite Working-facing `CORE_PILOT_STEPS` so the inhabited findings document is the work after spawn (disposition, trail, quiet-engine honesty), finalize is a verb that returns to the desk, and review-detail hrefs are inspector/recovery — not Home. Inventory ZIP, ROI, and audit CSV may remain later optional steps; they must not precede findings work or present as the spine.
2. When `ArchitectureId` is known, primary hrefs for findings/continue use `resolveWorkingInhabitedFindingsLandingHref` (or equivalent). Do not delete Guided/demo eval chrome. Do not run GTM M-90. Do not mount a pipeline stepper on Working Home (IH-069 ratchet stays).
3. Flip the core-pilot inventory row to `teachesPipeline: false` and `ownerPrompt` to `IR-002`. Update `core-pilot-steps.test.ts` and any help copy guard that still asserts execute-on-review-detail as the Working product path.

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
