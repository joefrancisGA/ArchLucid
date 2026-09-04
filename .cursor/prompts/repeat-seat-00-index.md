<!-- Repeat-seat Composer prompts — paste one prompt per session.
     Origin: 2026-09-04 owner diagnosis that ArchLucid is a working-architect
     tool (all-day use; livelihoods may depend on it), not a casual evaluator.
     Wave 3 after LI-01–15 (#1397) and LD-01–15. Do not implement from this index. -->

# Repeat-seat mitigations — Composer prompt set (RS-01–RS-15)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13; ADR 0052). **LI-01–15 shipped** (#1397). **LD-01–15 shipped** (#1421 / #1439). This set **shipped** as **RS-01–15** on `master` (#1457). Do not re-run. Wave 4 predicted leftovers: [`working-architect-00-index.md`](working-architect-00-index.md) (**WA-01–24**).

This set is **wave 3** — leftovers from the same livelihood diagnosis that **LD does not cover** (spawn as two objects, quiet-engine wizard CTA, infeasible pending empty, document-while-running, demo/paying ops inversion, dirty-guard CI inventory, print *opener* keepalive, account-scoped ROI prefs, concurrency as a desk event). Do **not** re-run LI, PT, WD, or LD from this index.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DD / PT / WD** | Earlier waves | Do not re-run / do not fork |
| **LI-01–15** | 2026-09-03 residuals | **Shipped** #1397 |
| **LD-01–15** | 2026-09-04 residuals | **Shipped** #1421 / #1439 |
| **RS-01–15** | **This set** — wave 3 unique leftovers | **Shipped** #1457 — do not re-run |
| **WA-01–24** | Wave 4 chrome + career edges | **Shipped** #1496 — do not re-run |
| **CD-01–15** | Wave 5 unique leftovers | [`career-desk-00-index.md`](career-desk-00-index.md) |
| **AD-01–12** | Wave 6 all-day desk leftovers | [`all-day-desk-00-index.md`](all-day-desk-00-index.md) |

If an RS row lists an LD/LI/PT/WD owner, **do not fork** that file. Implement only the leftover in *What to build*.

## Run order

Prefer **04 → 01 → 02** first (one object after spawn, quiet-engines stay on this document, coverage on the seal desk). Then **03** (infeasible pending empty). Then **05–09** (document-while-running, inversion, dirty inventory, keyboard context, print opener). Then **10–15** (account prefs, conflict, unknown sentinel, workbench flash, merge-conflict cue). Independent after **04** except **02** after **01** if both run.

**04** must not reintroduce a desktop **More** menu. **02** must not change `typed-engine-protected`.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `repeat-seat-01-quiet-engines-same-document.md` | Quiet-engine CTA still opens guided intake | LD-03 (queues/packets); LI-01 placement |
| 02 | `repeat-seat-02-coverage-on-seal-desk.md` | Engines that did not run are not next to Finalize | LD-03; LI-03 visibility |
| 03 | `repeat-seat-03-infeasible-pending-empty.md` | Pre-finalize deliverables empty still talks as if a yes is coming | LI-02; LD does not cover this empty |
| 04 | `repeat-seat-04-one-object-after-spawn.md` | Soft handoff + this-browser ack lets draft and review diverge | WD-10; IA-007; **unique vs LD** |
| 05 | `repeat-seat-05-document-while-analysis-runs.md` | Findings can look all-clear while analysis is still running | LD-11 (hub queue); LI-08 |
| 06 | `repeat-seat-06-paying-user-ops-inversion.md` | Demo suppresses ops banners; the paying shell shows them | LD-10 leftover inversion |
| 07 | `repeat-seat-07-dirty-guard-inventory.md` | New dirty forms can forget the helper; no CI inventory | LD-12 leftover platform |
| 08 | `repeat-seat-08-keyboard-from-open-package.md` | On-review Ask/graph/compare can still land empty | LD-09 leftover context |
| 09 | `repeat-seat-09-meeting-print-opener.md` | Print is a second window; the opener can still expire | LD-13 leftover; LI-14 |
| 10 | `repeat-seat-10-account-scoped-desk-prefs.md` | ROI loaded hourly cost stays this-browser-only | LI-12 leftover; **unique vs LD** |
| 11 | `repeat-seat-11-conflict-is-the-desk.md` | Concurrent writes are last-write-wins silence | **unique vs LD** |
| 12 | `repeat-seat-12-unknown-sentinel-not-architecture.md` | Unknown placeholders can still become graph/requirement nodes | LI-01 projector leftover |
| 13 | `repeat-seat-13-workbench-first-paint.md` | Tab-only flash before workbench preference hydrates | LI-09 leftover |
| 14 | `repeat-seat-14-finding-conflict-on-list.md` | Merge conflicts only on inspect, not the Working list | **unique vs LD** |
| 15 | `repeat-seat-15-empty-preset-sample-gated.md` | Operator empty presets still hero “see a sample review” in Working | LD-06 leftover presets |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| LI-01–15 | `master` #1397 |
| LD-01–15 prompt set | `.cursor/prompts/livelihood-desk-00-index.md` — run that wave; do not copy it here |
| Working default / buyer-polish false / 300s undo / 4h idle | workspace-mode, demo-ui-env, mutation registry, session-idle-timeout |
| In-flight Overview/hub desk | `composeOperatorHomeSections` `in-flight`; `ReviewsHubInFlightAnalysisDesk` |
| Record correction API | `POST /v1/governance/mutation-corrections` |
| Finding `findingId` URL restore | `REVIEW_DETAIL_FINDING_PARAM` |
| Decision-receipt empty for infeasible | `RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT` |
| Draft 409 panel | `architecture-draft-conflict` |
| Finding-graph Working outline | LI-15 |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` (owner decision).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary (package, finding, sealed review record).
- Verification: focused Vitest from `archlucid-ui/`. Scoped `.\scripts\ci\agent-compile-check.ps1` only when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior. Do not mark LI or LD as undone.

**Wave 4 (shipped #1496 — do not re-run):** [`working-architect-00-index.md`](working-architect-00-index.md) (**WA-01–24**). Do not fork RS.
**Wave 5:** [`career-desk-00-index.md`](career-desk-00-index.md) (**CD-01–15**). Do not fork WA.
**Wave 6:** [`all-day-desk-00-index.md`](all-day-desk-00-index.md) (**AD-01–12**).
