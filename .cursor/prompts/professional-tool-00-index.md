<!-- Professional-tool mitigation prompts — paste one prompt per Composer session.
     Origin: owner question that ArchLucid is a working-architect tool (all-day use;
     livelihoods may depend on it), not a casual evaluator product.
     Last updated: 2026-09-03 (wave 2 — residual livelihood gaps after PT-01–10).
     Fifteen-prompt residual set: livelihood-instrument-00-index.md (LI-01–15).
     Successor leftovers (2026-09-04): livelihood-desk-00-index.md (LD-01–15) shipped.
     Wave 3: repeat-seat-00-index.md (RS-01–15) shipped #1457.
     Wave 4: working-architect-00-index.md (WA-01–24) shipped #1496.
     Wave 5: career-desk-00-index.md (CD-01–15).
     Wave 6: all-day-desk-00-index.md (AD-01–12).
     Wave 7: founding-desk-00-index.md (FD-01–13).
     Wave 8: instrument-spine-00-index.md (IS-01–15). -->

# Professional-tool mitigations — Composer prompt set

ArchLucid sells a **seat for a repeat professional**. Production UX still treats many paths as **first-session / buyer-eval**. **PT-01–10** close identity, start path, tabs, amend, keyboard actions, ranking, trail visibility, first-paint, and home-queue. **PT-11–20** close the next livelihood gaps: workbench, continuity, presenter, infeasible-as-product, finalize gate, dirty documents, meeting session, and cheap compare entry.

**Run order:** Wave 1 independent; prefer **01 → 02** first. Wave 2 independent of wave 1 except **12** after **11** if both run, and **17** after **08** if both run. **04** / **11** / **12** must not reintroduce a desktop **More** menu for review workspace tabs. **07** / **17** must not change `typed-engine-protected`.

**Structural companion (do not implement from this paragraph):** [`working-desk-00-index.md`](working-desk-00-index.md) — twelve prompts for eval-spine identity, finding-desk honesty, in-flight queue, ops leakage, one-lifecycle IA, and eight-hour a11y. Each WD file names the PT owner where it overlaps; do not fork.

**Fifteen-prompt residual set (shipped — do not re-run):** [`livelihood-instrument-00-index.md`](livelihood-instrument-00-index.md) (**LI-01–15**, `master` #1397).

**LD-01–15 (shipped):** [`livelihood-desk-00-index.md`](livelihood-desk-00-index.md) — `master` #1421 / #1439. Do not re-run.

**Wave 3 (shipped):** [`repeat-seat-00-index.md`](repeat-seat-00-index.md) (**RS-01–15**, `master` #1457). Do not re-run.

**Wave 4 (shipped #1496):** [`.cursor/prompts/working-architect-00-index.md`](working-architect-00-index.md) (**WA-01–24**). Do not re-run.
**Wave 5:** [`.cursor/prompts/career-desk-00-index.md`](career-desk-00-index.md) (**CD-01–15**). Do not fork WA.
**Wave 6:** [`.cursor/prompts/all-day-desk-00-index.md`](all-day-desk-00-index.md) (**AD-01–12**).
**Wave 7:** [`.cursor/prompts/founding-desk-00-index.md`](founding-desk-00-index.md) (**FD-01–13**). Do not fork AD-09 or AD-10.
**Wave 8:** [`.cursor/prompts/instrument-spine-00-index.md`](instrument-spine-00-index.md) (**IS-01–15**). Do not re-run PT.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-645** vocabulary must stay; **TB-135** / **TB-136** stay closed).

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| Working is the default workspace mode | `DEFAULT_WORKSPACE_MODE = "working"` in `workspace-mode.ts` |
| Teaching chrome fails closed until Guided mounts | `use-teaching-chrome-visible.ts` |
| Finding undo window is several minutes | `MUTATION_UNDO_WINDOW_SECONDS = 300` |
| Working skips first-session / role-density nav hide | `useOperatorShellNavRows.ts` `skipProgressiveNavDensity` |
| Review-detail resolver keeps all tabs, empty `moreTabIds` | `resolve-review-detail-visible-tabs.ts` |
| Working-mode chrome helper exists | `architect-workspace-chrome.ts` / `useArchitectWorkspaceChrome` |
| Governance findings queue density sort + opt-in hide-generic | `governance-findings-density-sort.ts` + `GovernanceFindingsQueueClient.tsx` |
| `TransparencyTrailPanel` exists | `TransparencyTrailPanel.tsx`; mounted on feasibility verdict section |
| First-review guide omits sample href on live recovery | `isLiveOperatorShellRecoveryContext()` in `use-first-review-guide-state.ts` |
| Shortcut boundary wraps the full shell (header + nav + main) | `AppShellClient.tsx` |
| Split workbench component exists (Working preference, first-paint still `useState(false)`) | `ReviewWorkbenchLayout.tsx` / `use-professional-workbench-enabled.ts` |
| Decision-receipt export types and download button exist | `decision-receipt-export.ts` / `DecisionReceiptExportButton.tsx` |
| Working idle timeout is 4 hours when the guard is mounted | `SESSION_IDLE_WORKING_TIMEOUT_MS` |

## Residual mapping (this rewrite)

| # | Prompt file | Concern it mitigates |
|---|-------------|----------------------|
| 01 | `professional-tool-01-buyer-polish-eval-only.md` | `isBuyerPolishedOperatorShellEnv()` always returns true in production |
| 02 | `professional-tool-02-no-sample-recovery.md` | Review-detail errors still offer Claims Intake as recovery |
| 03 | `professional-tool-03-expert-start.md` | Working start path is still a first-run wizard |
| 04 | `professional-tool-04-stable-review-tabs.md` | Create-home still splits primary/Additional; labels change by lifecycle |
| 05 | `professional-tool-05-durable-amend.md` | Approve / reject / promote / archive stay one-way after confirm |
| 06 | `professional-tool-06-keyboard-work.md` | Shortcuts and palette still navigate; they do not do the work |
| 07 | `professional-tool-07-finding-ranking.md` | Review-detail finding lists still lack Working-mode density ranking |
| 08 | `professional-tool-08-transparency-trail.md` | Asserted / inferred / skipped trail is not first-class on Overview or pre-finalize |
| 09 | `professional-tool-09-instrument-first-paint.md` | Shortcuts and idle-timeout are deferred for first-load JS, not for daily use |
| 10 | `professional-tool-10-work-queue-home.md` | Overview still competes first-run / sample heroes with the work queue |

Deleted filenames from the first draft (`professional-tool-01-working-default.md`, `professional-tool-02-working-chrome.md`, `professional-tool-05-durable-undo.md`, `professional-tool-09-no-sample-recovery.md`, `professional-tool-10-working-nav.md`) are replaced by the residual files above. Do not resurrect those old titles.

## Wave 2 — residual livelihood gaps (PT-11–20)

Do **not** re-run PT-01–10 from this index. These ten assume wave 1 is either shipped or still queued; each prompt names the overlap and forbids duplicate work.

| # | Prompt file | Concern it mitigates |
|---|-------------|----------------------|
| 11 | `professional-tool-11-workbench-default.md` | Split workbench hydrates as tab-only; preference is browser-local |
| 12 | `professional-tool-12-workbench-selection-sync.md` | Three columns stay co-visible but unlinked |
| 13 | `professional-tool-13-cross-device-draft.md` | Unsaved typing is advertised as this-browser-only |
| 14 | `professional-tool-14-restore-review-context.md` | Refresh loses selected finding and workbench focus column |
| 15 | `professional-tool-15-presenter-mode.md` | Conference-room / projector loop has no presenter surface |
| 16 | `professional-tool-16-infeasible-as-package.md` | A reasoned “no” is still appendix chrome, not the package |
| 17 | `professional-tool-17-skipped-must-blocks-finalize.md` | Skipped MUST questions can stay visible without blocking seal |
| 18 | `professional-tool-18-universal-dirty-guard.md` | Unsaved navigation guard exists only on architecture drafts |
| 19 | `professional-tool-19-meeting-token-keepalive.md` | OIDC expiry warning can kill a projector session in two minutes |
| 20 | `professional-tool-20-compare-from-review.md` | What-if / compare requires leaving the review with empty inputs |

## Global constraints (every prompt)

- Working-tree safety: run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip that path and report it.
- **Do not** hide desktop review workspace tabs behind a **More** menu or overflow. Mobile may keep a select. See `.cursor/rules/no-collapse-workspace-tabs.mdc`.
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` demotion behavior (owner decision). Prompt 07 is presentation/ranking only. Prompt 17 is finalize **scorecard** wiring of skipped MUST rows, not density demotion.
- **Do not** implement GTM V1.1 human cohorts (#2, #3, #5, #6) or SOC 2 CPA / third-party pen-test programs.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Buyer-visible copy stays in `CONCEPT_VOCABULARY.md` / `VOCABULARY_ROSETTA.md`. **TB-645** vocabulary (package, finding, sealed review record) must not revert to run/job/manifest jargon.
- Verification: focused Vitest (`npx vitest run <files>` from `archlucid-ui/`). Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says otherwise.
- UI: Carbon-inspired density (`docs/library/UI_DESIGN_SYSTEM.md`). Sentence case. No ghost/link `Button` variants. Form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first line in a method; check nulls; prefer LINQ and concrete types.

## After each prompt

Summarize: files changed, tests run, residual risk, and whether Working vs Guided still behaves as specified.
