# IP-004 — Working share copies the inhabited findings document

**Wave:** inhabit post-IR leftovers (**IP**). **Not wave 35.** **Cluster:** dual-place. **Depends on:** IP-001, IH-056.

Do not implement from the post-IR index. Implement only *What to build*.

## Goal

On Working, when both `architectureId` and `reviewId` are known, `workingShareHref` (and Copy review link) copies architecture-nested **findings** for that job, not nested review-detail. Unlinked jobs may still copy the review URL with the existing unlinked toast.

## Why

`workingShareHref` prefers `architectureNestedReviewPath` (AO-09 locator). After ADR 0100 the shareable afternoon document is nested findings. Clipboard currently hands a colleague the job inspector.

## Context

- `lib/architecture/working-share-href.ts` · `WorkingReviewCopyLinkButton.tsx` · `working-share-href.test.ts` (AO-09 / SY-21)

Leftover owners named in Depends on — do not re-run those bodies.

## What to build

1. Working share with both ids: default href is `architectureNestedFindingsPath` + `runId` (preserve honest extra search such as `roomElicitation` / `focusedFinding` when already on that document). Do not share `/governance/findings`. Guided may keep nested review locator if tests require AO-09 Guided split — document the split.
2. Keep `WORKING_SHARE_UNLINKED_JOB_TOAST` when architecture is unknown. Do not restore breadcrumbs.
3. Flip share inventory row. Owner `IP-004`. Update `working-share-href.test.ts`: Working + both ids → nested findings, not `/reviews/{id}` as the path tail.

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
