> **Scope:** Cross-run **real-mode** (Azure OpenAI, non-simulator) faithfulness rollup that aggregates per-run human-counted correctness signals into a single **sponsor-facing correctness verdict**. Complements the single-session [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) and the [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) runbook. **Not** a substitute for automated eval jobs, CPA SOC 2, or third-party pen testing.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Real-mode faithfulness rollup (sponsor-facing correctness gate)

**Audience:** Release owner / pilot architect deciding whether real-mode finding correctness is good enough to put a finalized architecture package in front of a sponsor.

**Outcome:** One table per cohort that rolls up the human-counted faithfulness signals from ≥3 real-mode runs and resolves a single verdict — **GOOD ENOUGH FOR SPONSOR-FACING PILOTS** or **HOLD** — with the specific runs that forced a HOLD.

---

## Hard rule — real-mode only

This rollup measures whether **real** agent output is faithful. It therefore has one non-negotiable admission rule:

> **Simulator, fallback-without-label, offline-fixture, and demo-tenant output MUST NOT populate this rollup.** They are not real-mode faithfulness proof. Offline corpus numbers (e.g. [`faithfulness-report.md`](faithfulness-report.md)) are a *parity* signal only and belong in release-engineering notes, **not** in the sponsor-facing verdict below.

Admissible execution modes for a row: **Real**, or **Mixed** only when each non-real agent is reviewed and labeled per [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) (Execution mode → PASS/WARN/HOLD table). Any **Simulator** or unlabeled **Fallback** row is inadmissible and must be dropped (not scored as HOLD — dropped).

---

## How to use

1. Run ≥3 real-mode committed runs per [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md); record each with [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md).
2. For each admissible run, score one **per-run faithfulness row** below.
3. Aggregate into the **cohort rollup** and apply the **sponsor-facing correctness gate**.
4. Attach the result alongside `artifacts/release/real-llm-evidence-gate.json` per [`RELEASE_CLAIM_GATE.md`](RELEASE_CLAIM_GATE.md).

---

## Per-run faithfulness row (copy one per admissible run)

| Field | Value | Notes |
|-------|-------|-------|
| **Run id** | `<authority-run-guid>` | Matches the session record |
| **Date (UTC)** | | |
| **Execution mode** | Real / Mixed (labeled) | Simulator/unlabeled-fallback ⇒ row is **inadmissible** |
| **Packet source** | Internal brief / sanitized buyer packet id | No customer PII in repo |
| **Top findings (count · max severity)** | e.g. `6 · High` | From the finalized architecture package |
| **Evidence-chain completeness** | % of top findings whose claim → cited evidence chain is verifiable by the operator | Score the **highest-severity** finding explicitly |
| **Unsupported-claim count** | integer | Findings/claims with no sufficient cited evidence (plausible ≠ supported) |
| **Wrong / overstated finding count** | integer | Findings that are factually wrong or overstate severity/impact |
| **Retrieval faithfulness support ratio** | 0.00–1.00 or `n/a` | From [`faithfulness-report.md`](faithfulness-report.md) when retrieval-backed claims are part of the sponsor story; floor **0.80** |
| **Sponsor-send disposition** | READY / WARN / HOLD | Reuse [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) PASS/WARN/HOLD |
| **BLOCK rows on sponsor handoff** | integer | `real-llm-sponsor-evidence` BLOCK findings |
| **Operator note** | 1–3 sentences | What, if anything, you would not send and why |

---

## Cohort rollup

> **ILLUSTRATIVE FORMAT ONLY — replace every cell with real authorized-run data. Do not populate from simulator/offline fixtures.** The placeholder row below shows the shape, not evidence.

| Run id | Mode | Packet | Findings | Evidence-chain % | Unsupported | Wrong/overstated | Support ratio | Disposition | BLOCK rows |
|--------|------|--------|---------:|-----------------:|------------:|-----------------:|--------------:|-------------|-----------:|
| `<guid-1>` | Real | `<brief-id>` | — | — | — | — | — | — | — |
| `<guid-2>` | Real | `<brief-id>` | — | — | — | — | — | — | — |
| `<guid-3>` | Real | `<brief-id>` | — | — | — | — | — | — | — |

**Cohort aggregates (real data only):**

- Admissible runs scored: `<n>` (must be ≥3)
- Total unsupported claims surviving to sponsor packet: `<sum>`
- Total wrong / overstated findings on sponsor-sent items: `<sum>`
- Min evidence-chain completeness on any highest-severity finding: `<min %>`
- Min retrieval support ratio where retrieval-backed: `<min>` (floor 0.80)
- Runs with READY or WARN disposition: `<k>` of `<n>`
- Total BLOCK rows across cohort: `<sum>`
- Real-mode evidence gate freshness: `<date>` (≤30 days)

---

## Sponsor-facing correctness gate

Correctness is **GOOD ENOUGH FOR SPONSOR-FACING PILOTS** only when **all** of the following hold across the admissible cohort. Any single failure ⇒ **HOLD**, and the HOLD must name the offending run(s).

| # | Condition | GOOD ENOUGH | HOLD |
|---|-----------|-------------|------|
| 1 | Admissible real-mode runs scored | ≥ 3 | < 3 |
| 2 | Unsupported claims surviving to a sponsor packet | 0 | ≥ 1 |
| 3 | Wrong / overstated findings on sponsor-sent items | 0 | ≥ 1 |
| 4 | Evidence-chain completeness on every highest-severity finding | meets configured floor | below floor |
| 5 | Retrieval support ratio where retrieval-backed claims are sent | ≥ 0.80 | < 0.80 |
| 6 | Runs with READY or WARN disposition | ≥ 2 of 3 (Stage 1 advance rule) | < 2 of 3 |
| 7 | BLOCK rows on any sponsor handoff | 0 | ≥ 1 |
| 8 | Real-mode evidence gate freshness | ≤ 30 days (or labeled partial-real-mode) | stale + full-real-mode claim |

Conditions 1, 6, 7, 8 reuse the Stage 1 advance rule and sponsor-send stop conditions in [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md); condition 5 reuses the `minSupportRatio` floor in [`faithfulness-report.md`](faithfulness-report.md). Conditions 2–4 are the human-counted faithfulness signals this rollup adds on top of the structural/semantic gate in `real-llm-evidence-gate.json`.

**Verdict:** `GOOD ENOUGH FOR SPONSOR-FACING PILOTS` / `HOLD`
**HOLD reason (if any):** run id(s) + failing condition number(s)

---

## Why a rollup on top of the existing gate

The existing `real-llm-evidence-gate.json` (quad-agent path) and per-run template answer *"did this run pass structural/semantic floors and PilotStrict?"*. They do **not** aggregate the **human-judged** faithfulness signals — unsupported-claim count, wrong/overstated finding count, evidence-chain completeness on the highest-severity finding — into a single sponsor-facing correctness decision. This rollup closes that gap so the owner can answer *"is correctness good enough to put in front of a sponsor?"* from one table, without re-deriving it from scattered per-run records.

---

## Related

- [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) — single-session record (per-run inputs)
- [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) — run matrix, PASS/WARN/HOLD, sponsor-send stop conditions
- [`faithfulness-report.md`](faithfulness-report.md) — offline retrieval support ratio (parity signal only)
- [`RELEASE_CLAIM_GATE.md`](RELEASE_CLAIM_GATE.md) — where the rollup attaches at RC
- [`CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16`](../go-to-market/CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16) — sponsor-surface send/no-send audit (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias)
- [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) — agent quality vocabulary
