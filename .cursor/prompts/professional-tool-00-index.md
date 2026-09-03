<!-- Professional-tool mitigation prompts — paste one prompt per Composer session.
     Origin: owner question that ArchLucid is a working-architect tool (all-day use;
     livelihoods may depend on it), not a casual evaluator product.
     Last updated: 2026-09-03 (residual rewrite after first-pass landings). -->

# Professional-tool mitigations — Composer prompt set

ArchLucid sells a **seat for a repeat professional**. Production UX still treats many paths as **first-session / buyer-eval**. These ten prompts close the remaining gaps.

**Run order:** independent. Prefer **01 → 02** first (buyer-polish identity unblocks live recovery). **04** must not reintroduce a desktop **More** menu for review workspace tabs. **07** must not change `typed-engine-protected`.

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

## Global constraints (every prompt)

- Working-tree safety: run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip that path and report it.
- **Do not** hide desktop review workspace tabs behind a **More** menu or overflow. Mobile may keep a select. See `.cursor/rules/no-collapse-workspace-tabs.mdc`.
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` demotion behavior (owner decision). Prompt 07 is presentation/ranking only.
- **Do not** implement GTM V1.1 human cohorts (#2, #3, #5, #6) or SOC 2 CPA / third-party pen-test programs.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Buyer-visible copy stays in `CONCEPT_VOCABULARY.md` / `VOCABULARY_ROSETTA.md`. **TB-645** vocabulary (package, finding, sealed review record) must not revert to run/job/manifest jargon.
- Verification: focused Vitest (`npx vitest run <files>` from `archlucid-ui/`). Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says otherwise.
- UI: Carbon-inspired density (`docs/library/UI_DESIGN_SYSTEM.md`). Sentence case. No ghost/link `Button` variants. Form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first line in a method; check nulls; prefer LINQ and concrete types.

## After each prompt

Summarize: files changed, tests run, residual risk, and whether Working vs Guided still behaves as specified.
