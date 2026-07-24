> **Scope:** Recurring governance for ArchLucid vs frontier-AI counterfactual comparisons — process only; no product implementation.

# Frontier-AI counterfactual maintenance cadence

**Audience:** Founder / GTM lead maintaining honest differentiation claims as frontier models evolve.  
**Canonical scoreboard:** [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](../FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md)  
**Execution tracked as:** GTM backlog **M-40 (V1.1)** — live bakeoff sessions and scoreboard rows require human participants; this cadence doc is the V1 design half.

Bakeoff protocols and the scoreboard already exist. This document defines **when** to run, **what** to measure, and **how** to update claims when ArchLucid underperforms — so positioning drifts from data, not intuition.

---

## Monthly minimum cadence

Run on the **first Monday** of each calendar month (or within 3 business days after month-end if no session that week).

| Step | Action | Owner | Done when |
| --- | --- | --- | --- |
| 1 | Review scoreboard rollup at `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` | Founder | Cohort metrics current (≥0 sessions; note if n < 3) |
| 2 | Run **≥1** bakeoff **or** document why skipped (capacity, no sanitized packet) | Facilitator | Session row appended **or** skip reason logged |
| 3 | Refresh cohort rollup when n ≥ 3 | Founder | Positioning signal table updated |
| 4 | Apply **claim update rules** (below) to GTM copy checkpoints | Founder | No external claim contradicts latest rollup |
| 5 | File sanitized monthly summary under [`../validation-runs/`](../validation-runs/) if committing stats | Founder | Counts only — no session quotes |

**Monthly minimum:** at least **one** scoreboard review; target **one** new bakeoff session per month when sanitized packets are available.

---

## Urgent re-run triggers (within 14 days)

Schedule an **urgent** bakeoff (in addition to monthly review) when any trigger fires:

| Trigger | Why |
| --- | --- |
| Major frontier model release (Claude, GPT, Gemini, or Cursor default model bump) advertised as material reasoning upgrade | Commoditization risk shifts — stale comparisons mislead |
| ≥2 paid-pilot or bakeoff sessions with `decisionDeltaOutcome: FAIL` in 30 days | Decision-advantage narrative may be wrong |
| New loss mode **L5** (finding novelty gap) in **≥2** consecutive sessions | Faithfulness / reasoning claims need narrowing |
| Product change to agent orchestration, retrieval, or sponsor export labels | Counterfactual fairness requires same-input re-test |
| External competitor publishes architecture-AI benchmark relevant to ICP | Response discipline — run honest bakeoff, do not cite their numbers |

Log trigger + scheduled date in private GTM notes. Do not publish reactive superiority claims before the re-run completes.

---

## Required metrics (per session)

Mirror scoreboard fields — do not add ad-hoc metrics mid-cohort.

| Metric | Pass / guardrail |
| --- | --- |
| Decision-change count | Record 0–N honestly; **0** is valid data |
| Decision-delta outcome | PASS / WARN / FAIL per [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) |
| Repeat-use intent (1–5) | Record participant answer; median tracked at n ≥ 3 |
| Strongest ArchLucid loss mode | One L1–L7 or `none` — **required** even when ArchLucid wins |
| Timing basis | `measured` / `self-reported` / `unknown` — unmeasured timing is **illustrative only** |
| Anti-claims OK | **N** blocks external use of that row |

### Cohort guardrails (n ≥ 3)

| Guardrail | Pass | Hold external claims |
| --- | --- | --- |
| Decision-change rate | ≥ 50% sessions with count ≥ 1 | < 33% |
| PASS rate | ≥ 50% | < 33% |
| Median repeat-use intent | ≥ 3 | < 2.5 |
| Top loss mode L1 or L7 | ≤ 50% of sessions | > 66% |
| Measured timing basis | Majority of rows | Minority — do not quote speed medians |

**Hold** means: pause strengthening of decision-advantage or speed claims until the next month improves the guardrail or positioning is narrowed per loss-mode table.

---

## Claim update rules when ArchLucid underperforms

Apply honestly — never omit losing sessions.

| Observed pattern | Update rule |
| --- | --- |
| L1 or L7 dominant (speed / process overhead) | **Narrow:** lead with packaging, audit trail, repeatability — **stop** implying day-one speed parity with raw frontier AI |
| L5 ≥ 2 sessions (novelty gap) | **Narrow:** reasoning superiority claims; prioritize correctness and evidence-chain work |
| Decision-change rate below hold threshold | **Hold:** decision-advantage headline claims; run M-43/M-45 cohort before outbound |
| Repeat-use median below hold threshold | **Hold:** voluntary-usage and 30-day retention messaging |
| FAIL rate > PASS rate in rolling 90 days | **Revise:** executive brief to emphasize governance infrastructure, not insight supremacy |
| ArchLucid wins on packaging/traceability (`none` loss + PASS) | **Strengthen:** decision-infrastructure positioning per [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md#deal-cycle-heuristic-matrix) — still no "smarter than GPT" language |

### Anti-patterns (never)

- Publishing win percentages without scoreboard n ≥ 3 and anti-claims OK on all cited rows
- Dropping FAIL sessions from rollup
- Treating simulator rows as customer proof
- Reactive blog post within 48 h of a model release without a completed bakeoff

---

## Related assets

| Asset | Role |
| --- | --- |
| [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](../FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md) | Per-session rows + cohort rollup |
| [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md) | Session protocol |
| [`../../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md) | Five-step runbook |
| [`WHAT_NOT_TO_PROMISE.md`](../WHAT_NOT_TO_PROMISE.md) | Claim boundaries |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-40** | Scoreboard maintenance execution (V1.1) |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-43** | Real human-led bakeoff sessions (V1.1) |
