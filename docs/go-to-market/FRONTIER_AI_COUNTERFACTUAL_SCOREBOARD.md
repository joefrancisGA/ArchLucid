> **Reviewed:** 2026-07-25

> **Scope:** Rolling markdown scoreboard for recurring ArchLucid vs frontier-AI bakeoff sessions, plus maintenance cadence — honest counterfactual comparison only; not a benchmark claim.

# Frontier-AI counterfactual scoreboard

**Audience:** Founder / facilitator after each bakeoff session.  
**Last reviewed:** 2026-07-25

**Purpose:** Track recurring bakeoff outcomes in one place so positioning updates from **measured sessions**, not intuition.

**Canonical protocol:** [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md)  
**Evidence pack checklist:** [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md#evidence-pack-checklist)  
**Session template:** [`fixtures/bakeoff/frontier-ai-scoreboard.template.md`](../../fixtures/bakeoff/frontier-ai-scoreboard.template.md)  
**Runbook:** [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md)

---

## Artifact location

Store the live scoreboard under:

`artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md`

Copy the fixture template on first use:

```powershell
New-Item -ItemType Directory -Force -Path artifacts/bakeoff/scoreboard | Out-Null
Copy-Item fixtures/bakeoff/frontier-ai-scoreboard.template.md artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md
```

**Do not commit** customer-identifying session content. Pseudonymous session labels only if checked in.

---

## Per-session row (append after each bakeoff)

Complete within **48 hours** of the session. One row per session in the scoreboard table.

| Field | Values | Rule |
| --- | --- | --- |
| **Session label** | e.g. `demo-internal-03` | Unique; links to `artifacts/bakeoff/<label>/` |
| **Date (UTC)** | ISO date | |
| **Packet** | Sanitized brief name | No customer PII |
| **ArchLucid execution mode** | Real / Simulator / Mixed | Must match sponsor export |
| **Timing — ArchLucid (min)** | Number or `unknown` | Basis column required |
| **Timing — manual AI (min)** | Number or `unknown` | Basis column required |
| **Timing basis** | measured / self-reported / unknown | Unmeasured → **illustrative only** |
| **Decision-change count** | 0–N | ArchLucid findings that changed a decision **not** in manual pass |
| **Decision-delta outcome** | PASS / WARN / FAIL | Per [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) |
| **Repeat-use intent (1–5)** | Participant answer | 1 = would not return; 5 = definite return |
| **Strongest ArchLucid loss mode** | See taxonomy below | Honest primary loss; `none` when ArchLucid led |
| **Strongest ArchLucid win** | packaging / traceability / repeatability / governance / none | One line |
| **Anti-claims OK** | Y / N | N blocks external use of row |

---

## Strongest ArchLucid loss mode taxonomy

Pick **one** primary code per session.

| Code | Label | When to use |
| --- | --- | --- |
| **L1** | First-draft speed | Manual AI reached useful draft faster |
| **L2** | Setup friction | ArchLucid config/path blocked day-one value |
| **L3** | Exploratory breadth | Manual AI covered more ad hoc domains |
| **L4** | Narrative flexibility | Manual tone/structure fit sponsor better |
| **L5** | Finding novelty gap | Manual pass surfaced material issues ArchLucid missed |
| **L6** | Trust / label confusion | Execution-mode or evidence labels eroded confidence |
| **L7** | Process overhead | "Too much process" vs direct prompting |
| **none** | No clear ArchLucid loss | Packaging/traceability/repeatability led |

---

## Cohort rollup (after ≥3 sessions)

Update the rollup section at the bottom of the scoreboard file.

| Metric | How to compute |
| --- | --- |
| Median ArchLucid minutes | Median of measured rows only; note n |
| Median manual AI minutes | Median of measured rows only; note n |
| Decision-change rate | Sessions with decision-change count ≥1 / total |
| PASS rate | PASS outcomes / total |
| Median repeat-use intent | Across all sessions |
| Top loss mode | Most frequent L1–L7 code |
| Positioning signal | See table below |

### Positioning signals (honest)

| Pattern | Suggested GTM emphasis |
| --- | --- |
| L1 or L7 dominant | Lead with day-two packaging, audit, repeatability — not day-one speed |
| L5 ≥2 sessions | Narrow reasoning claims; engineering faithfulness priority |
| Decision-change rate ≥50% + repeat-use ≥3 | Strengthen decision-advantage narrative |
| Repeat-use median <3 | Hold scale claims; fix friction before outbound |

---

## Workflow

1. Run five-step bakeoff per [`PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md).
2. Complete `decision-delta.md` within 7 days.
3. Append one row to `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md`.
4. After session 3, refresh cohort rollup and review positioning signals.
5. Do **not** quote timing medians externally unless basis = measured for majority of rows.
6. Follow **Maintenance cadence** below.

---

## Maintenance cadence

**Execution:** GTM **M-40 (V1.1)** — live bakeoff sessions need human participants; this section is the process half.

### Monthly minimum

Run on the **first Monday** of each month (or within 3 business days after month-end).

| Step | Action | Done when |
| --- | --- | --- |
| 1 | Review scoreboard rollup at `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` | Cohort metrics current |
| 2 | Run **≥1** bakeoff **or** document skip reason | Session row or skip logged |
| 3 | Refresh cohort rollup when n ≥ 3 | Positioning signal table updated |
| 4 | Apply claim update rules to GTM copy | No external claim contradicts rollup |

### Urgent re-run (within 14 days)

Major frontier model release; ≥2 `decisionDeltaOutcome: FAIL` in 30 days; L5 novelty gap in ≥2 consecutive sessions; product change to agents/retrieval/export labels; competitor publishes relevant architecture-AI benchmark.

### Claim update rules (when ArchLucid underperforms)

| Pattern | Update |
| --- | --- |
| L1/L7 dominant | Narrow: packaging/audit/repeatability — stop implying day-one speed parity |
| L5 ≥ 2 sessions | Narrow reasoning-superiority claims |
| Decision-change rate below hold | Hold decision-advantage headlines |
| FAIL > PASS in 90 days | Revise brief toward governance infrastructure, not insight supremacy |

Never publish win % without n ≥ 3 and anti-claims OK; never drop FAIL sessions; never treat simulator as customer proof.

---

## Anti-patterns

- Claiming "ArchLucid is smarter than GPT/Claude/Gemini"
- Publishing invented win percentages
- Treating simulator sessions as live customer proof
- Omitting loss modes when ArchLucid underperformed

---

## Related

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — **M-40** scoreboard maintenance; **M-43** live bakeoffs
- [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md)
