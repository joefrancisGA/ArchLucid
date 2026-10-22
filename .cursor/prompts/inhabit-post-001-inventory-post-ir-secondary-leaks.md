# IP-001 — Inventory: post-IR secondary inspector leaks

**Wave:** inhabit post-IR leftovers (**IP**). **Not wave 35.** **Cluster:** inventory. **Depends on:** IR-018, post-IR diagnosis.

Do not implement from the post-IR index. Implement only *What to build*.

## Goal

Add a **new** leak inventory (TypeScript + markdown) for post-IR secondary surfaces. Do **not** flip closed `inhabit-leak-inventories.ts` IR/IH booleans back to false.

## Why

`WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`: the primary inhabit loop is honest; remaining livelihood failures are href/chrome leaks on the **job inspector**. Without a new inventory, the next diagnosis will reopen IR rows or start wave 35.

## Context

- `docs/architecture/WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`
- `archlucid-ui/src/lib/inhabit-leak-inventories.ts` (closed remain rows — do not revert)
- Pattern: IH-004–012 inventories

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. Add `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts` and `docs/architecture/INHABIT_POST_IR_LEAK_INVENTORIES.md` with rows for: Reviews hub Continue/row href, global search run/finding, `workingShareHref`, quick-decision Open finding / disposition, completion toast, `ReviewRoomHeaderButton` / room elicitation on review-detail, inspect support-band missing mode, secondary re-run honesty, inspector finalize missing `parentArchitectureId`, inhabited run-scope banner / first-paint trail. Each row: `surface`, `relativePath`, leak boolean, `ownerPrompt` (`IP-002`–`IP-011`).
2. Vitest that the module paths exist and markdown matches. Do not implement product hrefs here.
3. This prompt-set PR may include the inventory with all leak flags **true**. Product IPs flip them later.

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
- **Do not** re-run SG-001–081, LY-001–120, CG, SN, LN, LW, MG, DI, CE, DW, RP, **IH-001–080**, or **IR-001–018** product bodies except as a numbered leftover named in Context. **Do not** remount the CE Sketch runner. **Do not** invent `GET /v1/runs/{runId}/progress`. **Do not** draft-diff Compare.
- **Do not** start wave 35 or paste an 80-prompt pack. This file is one inhabit-post leftover (**IP**).
- Leftover owner: named in Context. **Do not re-implement that file.** Implement only *What to build*.
- If mounting start-honesty wrappers, do **not** call `useWorkspaceMode()` inside a wrapper that must render null without a provider (`WorkingExecuteStartHonestyNotices` pattern).
- Nested review-detail stays a **job inspector** (ADR 0098). Do not make it Monday morning. Peer `/governance/findings` stays peer (**IR-015**).
