# IR-010 — Continue-last persists architecture-shaped

**Wave:** inhabit remain leftovers (**IR**). **Not wave 35.** **Cluster:** continuity. **Depends on:** IH-011, IH-015, IH-066.

Do not implement from the remain index. Implement only *What to build*.

## Goal

Continue-last for Working is architecture-shaped and uses the same synced recents as IH-066, not a tab-local review-only localStorage walk. Working href already rewrites to inhabited findings; persist must match.

## Why

`resolve-continue-last-review-package.ts` reads `OPERATOR_RECENT_VIEWS_STORAGE_KEY` only, `persistKind: local-storage`, `architectureShaped: false`, owner IH-015. Recents DTO already has optional `architectureId`. A second machine or cleared site data drops Monday morning. The afternoon document is not the continuity primitive.

## Context

- `lib/resolve-continue-last-review-package.ts` · `working-workspace-continuity-sync.ts` · `OperatorRecentViewEntryDto.architectureId` · `resolveWorkingInhabitedFindingsLandingHref` · do not invent presence

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. Resolve continue-last from account-prefs recents (architecture id when known), with localStorage as cache — same sync path as IH-066. Working target stays inhabited findings landing. `architectureShaped: true`, persistKind `account-prefs` (or dual cache documented as account-prefs).
2. Do not restore system-wide breadcrumbs. Do not make last-open nested review-detail Monday morning (ADR 0098 / 0100). Guided may keep eval last-open.
3. Flip `INHABIT_CONTINUITY_ROWS` continue-last row. Owner `IR-010`. Focused Vitest: Working + recents with architectureId → nested findings href; missing architecture still falls back honestly.

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
