> **Scope:** Re-run the session-start **working-architect / founding-contract** diagnosis against repo state **after** inhabit wave 34 (ADR **0100**, PR **#3212**). This is **not** the V1 release-readiness scorecard (`.cursor/prompts/assessment.md`).
>
> **Origin diagnosis:** ArchLucid is a **working-architect tool** — all-day use; livelihoods may depend on the sealed record (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13).
>
> **Prompt index:** [`.cursor/prompts/inhabit-00-index.md`](../../.cursor/prompts/inhabit-00-index.md) · **Wave 34 close audit:** [`INHABIT_ACCEPTANCE_2026-09-13.md`](INHABIT_ACCEPTANCE_2026-09-13.md) · **Inventories:** [`INHABIT_LEAK_INVENTORIES.md`](INHABIT_LEAK_INVENTORIES.md)

# Working-architect diagnosis — 2026-09-13 leftovers

## Executive summary

**Yes.** After inhabit wave 34, Working is an inhabited findings afternoon on the open architecture — not a first-session evaluator. Three **start / completeness honesty** leaks still failed the all-day professional bar on surfaces architects use every day. This follow-up ships those leftovers. It does **not** start a wave-35 prompt pack.

| Metric | Count |
|--------|------:|
| **Closed in this follow-up** | **3** (IH-025 remaining Start surfaces, IH-043 peer table, IH-041 pre-finalize) |
| **Named leftovers (not this PR)** | Keyboard default-focus on finding cards, first-review / core-pilot pipeline teaching, continue-last still localStorage, peer `/governance/findings` back is not architecture-scoped, room still leaves findings for presenter/draft/L0 |
| **Intentional skips** | G-REAL-06, draft-diff Compare, presence/chat, unseal, merge kernels, lengthen 300s undo, desktop tab **More** |

**Headline:** The product already assumes a repeat professional. Remaining livelihood failures were **false confidence at execute** (Record CTA without Simulator incompleteness on wizard / re-run), **Career Supported on Simulator** on the peer findings table, and **quiet engines unnamed** on the pre-finalize checklist. Those three are now on the same honesty modules the desk already used.

## Method

1. Re-read R4 / R13 and inhabit inventories after `origin/master` `#3212`.
2. Trace remaining `hasSimulatorIncompletenessCopy: false` / `namesQuietEnginesOnDesk: false` / missing `structuralExecutionMode` on the peer table.
3. Reuse existing notices and `governanceQueueRowToSemanticSupportChipFinding` — no forked copy, no host Mode flip.
4. Focused Vitest on the honesty, inventory, wizard, strip, pre-finalize, and chip-guard files.

## What overlays already shipped (waves 1–34)

| Overlay | Evidence |
|---------|----------|
| Working default + inhabit ADR 0100 | `DEFAULT_WORKSPACE_MODE = "working"` · ADR 0100 Accepted |
| Record / Practice customer labels | ADR 0097 · chooser, not a third Mode picker |
| Record + Simulator start honesty (desk) | Draft footer + identity command bar |
| Practice start honesty | Same desk surfaces |
| 300s undo + record-correction copy | `MUTATION_UNDO_WINDOW_SECONDS = 300` · IH-035 |
| Quiet engines + measurement floor on inhabited document | IH-040 / IH-041 on `InhabitedFindingsDocumentChrome` |
| Simulator never green Supported on inhabited cards | IH-043 via `presentDecisionGradeSemanticSupportBand` |
| Pins / recents server sync | IH-066 |
| Nested findings landing | IH-015 |

## Remaining livelihood failures (this PR)

### 1. IH-025 remainder — false confidence at start

Draft footer and identity desk already mounted `WorkingRecordSimulatorStartHonestyNotice`. The **new-run wizard** and **review-package re-run / execute strip** could still present Start / re-run as if Simulator work were sealed-record-complete.

**Shipped:** `WorkingExecuteStartHonestyNotices` wraps Record+Simulator and Practice notices. Mounted on `NewRunWizardClient` and `ReviewPackageDoThisNextStrip` (happy path and failure-recovery). CTA stays enabled. Host `AgentExecution:Mode` is not flipped.

The wrapper reads `WorkspaceModeContext` and returns null when the provider is missing so wizard tests without the provider do not throw from child hooks.

### 2. IH-043 leftover — Simulator can show Career Supported on the peer table

Inhabited cards already pass `structuralExecutionMode` into `FindingSemanticSupportBandChip`. `GovernanceFindingsQueueOperationalRowCells` did not. Remap lives in `presentDecisionGradeSemanticSupportBand` → label **Practice — not record support**.

**Shipped:** operational row cells call `useAgentExecutionMode` and pass the mode into the shared chip via `governanceQueueRowToSemanticSupportChipFinding`. `GovernanceFindingRow` shows the chip on buyer and operational variants whenever a band exists.

### 3. IH-041 leftover — pre-finalize checklist silent on quiet engines

Nested findings chrome already names quiet engines. The pre-finalize checklist could read as Ready without that completeness sentence.

**Shipped:** `GovernanceFindingsQueueQuietEnginesHint` on `PreFinalizeChecklistPanel`. Run-progress Ready chrome remains the named open row (`namesQuietEnginesOnDesk: false`).

## Named leftovers, not this PR

| Leak | Why not here |
|-------|----------------|
| Room still leaves findings for presenter / draft / L0 | `INHABIT_ROOM_PRESENTER_ROWS` — no presence/chat |
| `useFindingCardShortcuts` default-focus incomplete | IH-010 remainder |
| First-review guide + `core-pilot-steps` still teach pipeline | IH-012 / IH-069 ratchet already exists; Guided may keep eval |
| Continue-last still localStorage | IH-011 |
| Peer `/governance/findings` back is not architecture-scoped | Intentional peer queue |

## Intentional skips (do not “fix”)

| Skip | Why |
|------|-----|
| G-REAL-06 / host Mode flip | Honesty only; finalize gate stays CG-021 |
| Draft-diff Compare | IH-077 |
| Presence / finding chat / unseal / 40th engine / merge `DraftRequests`/`Runs` | IH-078 |
| Lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300` | IH-073 |
| Desktop review-tab **More** menu | Product direction |

## This PR’s shipped cluster

| Item | Module |
|------|--------|
| Shared start honesty wrapper | `WorkingExecuteStartHonestyNotices.tsx` |
| Wizard + re-run strip | `NewRunWizardClient.tsx`, `ReviewPackageDoThisNextStrip.tsx` |
| Peer table Simulator remap | `GovernanceFindingsQueueOperationalRowCells.tsx` |
| Finding row chip without inhabited-only gate | `GovernanceFindingRow.tsx` |
| Pre-finalize quiet engines | `PreFinalizeChecklistPanel.tsx` |
| Inventory sync | `inhabit-leak-inventories.ts` + markdown |

## Constraints audit

| Constraint | Status |
|-----------|--------|
| No desktop review-tab **More** menu | **Pass** |
| No `typed-engine-protected` gate change | **Pass** |
| No 300s undo lengthening | **Pass** |
| No GTM M-90 / M-44 / M-91 / M-92 | **Pass** |
| No TB-135 / TB-136 reopen | **Pass** |
| No G-REAL-06 | **Pass** |
| TB-645 vocabulary | **Pass** |

## Recommendation

1. Merge this follow-up. Do **not** paste a wave-35 inhabit pack while these leftovers were the remaining livelihood leaks.
2. Next inhabit work, if any, is the named leftovers above — not a new 80-prompt wave.
3. Keep inventories and TS rows in sync; markdown was stale vs inspect/triage history and quiet-engine desk flags.
