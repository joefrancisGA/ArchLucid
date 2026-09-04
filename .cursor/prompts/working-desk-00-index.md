<!-- Working-desk Composer prompts — paste one prompt per session.
     Origin: owner question that ArchLucid is a working architect tool (all-day use;
     livelihoods may depend on it), not a casual evaluator product.
     These twelve mitigate the *structural* gaps after the professional-tool (PT-01–PT-10)
     residual set. Do not implement from this index; run one numbered file at a time.
     Created: 2026-09-03.
     Successor leftovers (2026-09-04): livelihood-desk-00-index.md (LD-01–15).
     Wave 3 unique leftovers: repeat-seat-00-index.md (RS-01–15). -->

# Working-desk mitigations — Composer prompt set (WD-01–WD-12)

ArchLucid sells a **seat for a repeat professional**. Working mode, finding undo, draft autosave, density sort, and a sync shortcut listener already exist. The remaining failures are a **first-session / pipeline spine** under that overlay.

**Do not implement GTM V1.1 human cohorts** (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). Do not treat this set as a V1 assessment scorecard.

**Relationship to PT-01–20:** `.cursor/prompts/professional-tool-00-index.md` is the overlay/residual set (identity, start path, tabs, amend, keyboard, ranking, trail, first-paint, home, workbench, presenter, infeasible package, MUST-finalize, dirty guard, token keepalive, compare). **WD-01–12** are the structural 12 from the livelihood-desk analysis. If a WD row lists a PT owner, **do not fork** — run or extend that PT file; use the WD file only for the residual named in *What to build*.

**Fifteen-prompt residual set (shipped):** [`livelihood-instrument-00-index.md`](livelihood-instrument-00-index.md) (**LI-01–15**, `master` #1397). Do not re-run.

**Next fifteen (run these first):** [`livelihood-desk-00-index.md`](livelihood-desk-00-index.md) (**LD-01–15**) — 2026-09-04 leftovers after LI. If an LD row lists a WD owner, do not fork — implement only the leftover *What to build* in that LD file.

**Wave 3 (after LD):** [`repeat-seat-00-index.md`](repeat-seat-00-index.md) (**RS-01–15**) — unique leftovers LD does not cover. If an RS row lists a WD owner, do not fork this file.

## Run order

Independent after **WD-01**. Prefer **01 → 08 → 02 → 03** first (identity, live recovery, decision record, finding honesty). **WD-04** must not collapse desktop review tabs. **WD-03** must not change `typed-engine-protected`. **WD-07** is live meeting elicitation — not the CTO demo overlay.

| # | Prompt file | Flaw it mitigates | PT owner (do not fork) |
|---|----------------|-------------------|------------------------|
| 01 | `working-desk-01-production-identity.md` | Eval-first spine; mode matrix is the product | PT-01 (env function); this file is call-site matrix |
| 02 | `working-desk-02-decision-record.md` | Career risk without a first-class trail at finalize | PT-08 visibility; PT-16 infeasible package; PT-17 MUST gate |
| 03 | `working-desk-03-finding-desk-honesty.md` | Unknowns and quiet engines look like a clean review | PT-07 ranking only — this file is honesty |
| 04 | `working-desk-04-amend-livelihood-writes.md` | Confirm-then-forever on approve / publish / archive | PT-05 |
| 05 | `working-desk-05-keyboard-does-the-work.md` | Shortcuts are a map, not a work surface | PT-06 |
| 06 | `working-desk-06-in-flight-desk.md` | The workday is wait-for-pipeline on one tab | — unique |
| 07 | `working-desk-07-meeting-elicitation.md` | Conference-room persona vs tabbed SPA / demo overlay | PT-15 presenter; PT-19 token keepalive |
| 08 | `working-desk-08-live-recovery-never-sample.md` | Live failures still think in Claims Intake | PT-02 |
| 09 | `working-desk-09-primary-path-not-ops.md` | Azure / Service Bus / COGS on the daily-driver path | — unique |
| 10 | `working-desk-10-one-lifecycle-desk.md` | Dual start objects, stranded drafts, no sealed-record home | PT-03 / PT-04 / PT-10 |
| 11 | `working-desk-11-instrument-before-chrome.md` | Remaining shell still deferred for Lighthouse | PT-09 sync keys/idle |
| 12 | `working-desk-12-eight-hour-a11y.md` | Graphs and teaching overlays fail eight-hour keyboard use | — unique |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| Working is the default | `DEFAULT_WORKSPACE_MODE = "working"` |
| Teaching chrome fails closed | `use-teaching-chrome-visible.ts` |
| Buyer-polish env default is false | `isBuyerPolishedOperatorShellEnv()` terminal `return false` |
| Finding undo several minutes | `MUTATION_UNDO_WINDOW_SECONDS = 300` |
| Working idle 4h + focus heartbeat | `session-idle-timeout.ts` |
| Draft autosave + unsaved guards | `use-architecture-draft-autosave.ts` |
| Review-detail `moreTabIds` empty | `resolve-review-detail-visible-tabs.ts` |
| Density sort on review findings (chrome) | `sortReviewDetailFindingsBySignal` |
| Overview transparency trail mount | `RunDetailOverviewTransparencyTrail.tsx` |
| Sync shortcut listener + idle guard | `AppShellSyncKeyboardShortcutListener`, `AppShellSyncSessionIdleGuard` |
| Palette omits Finish setup in Working | `resolve-visible-command-palette-actions.ts` |
| Alt+N Working → draft editor | `WORKING_MODE_NEW_REVIEW_ROUTE` |
| Structured-brief unknown placeholders block start (server) | `ArchitectureDraftReviewReadinessValidator` |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` (owner decision).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary stays (package, finding, sealed review record).
- Verification: focused Vitest from `archlucid-ui/`. Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior.
