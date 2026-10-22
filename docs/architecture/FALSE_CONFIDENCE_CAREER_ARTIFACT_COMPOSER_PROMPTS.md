> **Scope:** Copy-paste Composer prompts that close **false confidence on career artifacts** — stamp, finalize, sponsor PDF, print, ADR export, decision receipt, audit CSV, Ask/Compare exports. Internal engineering only — not buyer-facing marketing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/false-confidence-career-00-index.md`](../../.cursor/prompts/false-confidence-career-00-index.md) (**FC-01–FC-80**)
> **Working-seat leftovers (wave 19):** [`WORKING_SEAT_COMPOSER_PROMPTS.md`](WORKING_SEAT_COMPOSER_PROMPTS.md) (**WS-01–WS-24**) Accepts **0078** and owns Working finalize/visibility defaults — do **not** paste FC to evict buyer polish.
> **Successor (wave 20 — persist gates):** [`LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md`](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md) (**LP-01–LP-20**) — do **not** paste FC to implement TB-1221 emission/commit validators; LP wires persist gates FC named.

# False-confidence career-artifact Composer prompts (FC-01–FC-80)

**Created:** 2026-09-07 · **Status:** FC-01–03 + validator phases **shipped**; ADR **0078 Accepted** (WS-02); per-surface FC-04–80 inventories may have named leftovers only · **Do not paste** prior waves (LK, DR, CD, CR, WA, FD, IS, SD, PC) except as named leftovers in each FC file.

## Problem statement

**False confidence on the career artifact** is the class of defect where ArchLucid produces an official-looking output that is **more certain** than the governed review allows. Examples:

- Sponsor PDF omits skipped MUST questions shown on the desk.
- Stamp band says "decision-grade findings retained" while typed engines were never demoted (evaluator packaging ≠ analytical demotion).
- `StatusTag kind="ready"` on a decision-grade finding in a screenshot.
- Simulator execution emailed as Real without banner.
- Measurement floor passes when engine count is **null** (fail-open).
- Ask answers assert facts without citations.
- Compare diffs findings but hides assumption/trail deltas.
- Audit CSV contains "Quick approve" as if it were a human disposition narrative.

Prior waves fixed **pieces** (ADR 0073 trail gate, DR-01 floor, CD-05 stamp copy, CR-12 sponsor KPI). This wave **systematizes** the remainder with **ADR 0078** + shared validators + **80** one-session prompts.

## Diagnosis taxonomy

| Class | Livelihood failure | FC prompts |
|-------|-------------------|------------|
| **Missing provenance (R4)** | Stamp/export without asserted/inferred/skipped | 09–18, 53–55, 17 |
| **Implied demotion (0070)** | Decision-grade language implies density culled typed engines | 19–28, 80 |
| **Feasibility dishonesty (R5)** | Infeasible reads as failed job; hard without citation | 29–34 |
| **Trust label drift (0063)** | Heuristic findings look evidence-backed | 35–42 |
| **Sponsor overclaim** | External PDF cleaner than review | 43–52, 44–48 |
| **Eval/demo leakage** | Demo verify or sample rows export as production | 73–75, 78 |
| **Governance artifact noise** | Audit CSV / quick approve undermines career record | 76–79 |
| **Analysis overclaim** | Ask / Compare / Graph assert beyond evidence | 61–68 |
| **Pipeline theater** | Activity %, Ready status while blocked | 69–72 |

## Kernel prompts (run first)

| Prompt | Delivers |
|--------|----------|
| **FC-01** | ADR **0078** — career artifact honesty contract |
| **FC-02** | `evaluateCareerArtifactHonesty()` — TS single entry |
| **FC-03** | `CareerArtifactCompletenessValidator` — C# single entry |
| **FC-04–08** | Inventories + CI guards + OpenAPI blockReason fields |

All other FC prompts should call FC-02/03 when touching exports or finalize.

## Sequencing summary

See [`.cursor/prompts/false-confidence-career-00-index.md`](../../.cursor/prompts/false-confidence-career-00-index.md) for the full **Phase 0–8** run order and file catalog.

**Parallelism:** Phases 2–8 can parallelize by artifact owner after Phase 0 lands.

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- `DeterministicInsightDensityGate` demotion predicate unchanged (honesty only).
- Sealed bytes immutable — honesty banners on re-export only.
- 300s undo toast length unchanged (LK-01 document stack is separate).
- No 40th coverage engine (`HOLD_NO_COVERAGE_ENGINES.md`).
- No live presence / finding-comment chat / per-architecture ACL.

## Do not re-run (owners only)

| Set | Role |
|-----|------|
| **LK-08/09** | ADR 0073 + finalize trail gate — FC extends to exports |
| **DR-01–05** | Fail-closed completeness — FC-19/71/72 leftovers |
| **CD-05–07, 12, 15** | Stamp/print/sponsor — FC names surfaces, do not fork |
| **CR-01, 12** | Tests + sponsor Ready — FC-05, 46, 80 |
| **WA-07/08/09/13/22** | Ask/sponsor/compare — FC-61–66, 56, 69 |
| **FD-02/05/07/13** | Founding — FC-11, 10, 40, 21 |
| **PC-01/13** | Measurement floor presenter — FC-19 consumes |

## Global constraints

Same as index: TB-645 vocabulary, TB-2005 forms, no GTM cohorts, working-tree safety script, scoped compile, Terraform for any new infra (FC wave should not need net-new infra).

## Success criteria for the wave

When FC-01–80 are **Done**:

1. ADR 0078 is the cited contract in PR review for any export/finalize change.
2. Every path in `career-export-mounted-ui-paths` calls FC-02 (or is listed as exempt with ADR 0078 §Constraint).
3. No career export renders without either **complete honesty header** or **explicit blocked reason**.
4. CI guards FC-05/06/07 prevent regression to Ready-on-grade and formatter bypass.
5. A skeptical architect can email sponsor PDF + stamp screenshot to an ARB without hidden inference.

## After each prompt

Summarize: artifact hardened, tests, FC-02/03 parity, Working vs Guided, residual grandfather paths.
