# Daily-driver Composer prompts (DD-01–DD-10)

Copy-paste prompts for livelihood-grade workspace mitigations. Branch template: `cursor/<short-name>-4ec4`.

| ID | Status in branch `cursor/daily-driver-prompts-4ec4` |
|----|-----------------------------------------------------|
| DD-01 Gate 1 runbook + schema guard | Shipped — `docs/runbooks/GATE_1_SHIP_GATE_EVIDENCE.md`, `scripts/ci/assert_ship_gate_evidence_schema.py` |
| DD-02 Review route bundle reduction | Deferred — route already uses deferred chunks; needs bundle analyzer pass |
| DD-03 Overview IA streamlining | Partial — metrics/workspace context gated; Working mode + prior IA work retained |
| DD-04 In-app unsaved navigation guard | Shipped — `use-in-app-navigation-guard.ts`, draft workspace wiring |
| DD-05 Authoritative Query migration | Partial — `useRunSummaryQuery` authoritative mode |
| DD-06 Graph a11y list view | Shipped — `FindingEvidenceGraphOutline` toggle on finding graph |
| DD-07 System health polling | Shipped — 60s poll + since-load status transitions |
| DD-08 Working mode defaults | Pre-shipped — `WorkspaceModeSealDefaultEffect` in `app/layout.tsx` |
| DD-09 LRO sync-path audit | Documented in Gate 1 runbook; start-review uses navigation progress |
| DD-10 Review stale banner | Shipped — `ReviewWorkspaceStaleBanner` on review header |

See conversation transcript for full paste-ready prompt text.

**Successor set (2026-09-04):** **LD-01–15** and **RS-01–15 shipped** on `master` (#1421/#1439, #1457) — do not re-run. **Wave 4 shipped #1496:** [`.cursor/prompts/working-architect-00-index.md`](../../.cursor/prompts/working-architect-00-index.md) (**WA-01–24**) — owner index [`WORKING_ARCHITECT_COMPOSER_PROMPTS.md`](WORKING_ARCHITECT_COMPOSER_PROMPTS.md). **Wave 5:** [`.cursor/prompts/career-desk-00-index.md`](../../.cursor/prompts/career-desk-00-index.md) (**CD-01–15**) — owner index [`CAREER_DESK_COMPOSER_PROMPTS.md`](CAREER_DESK_COMPOSER_PROMPTS.md). **Wave 6:** [`.cursor/prompts/all-day-desk-00-index.md`](../../.cursor/prompts/all-day-desk-00-index.md) (**AD-01–12**) — owner index [`ALL_DAY_DESK_COMPOSER_PROMPTS.md`](ALL_DAY_DESK_COMPOSER_PROMPTS.md). **LI-01–15 shipped** (#1397). Predecessors: [`.cursor/prompts/professional-tool-00-index.md`](../../.cursor/prompts/professional-tool-00-index.md) (**PT-01–20**) and [`.cursor/prompts/working-desk-00-index.md`](../../.cursor/prompts/working-desk-00-index.md) (**WD-01–12**). Do not re-run DD-01–10. Each later file names the prior owner and forbids a fork.
