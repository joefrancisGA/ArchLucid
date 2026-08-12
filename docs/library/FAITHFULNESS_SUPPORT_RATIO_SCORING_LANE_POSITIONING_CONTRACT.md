> **Scope:** Engineering source of truth — where faithfulness / support-ratio scores sit architecturally (**TB-1228**). Prevents fusing inline commit gates, async eval, and model promotion.

# Faithfulness / support-ratio scoring lane positioning contract (TB-1228)

> **Audience:** Contributors, principal architects, and GTM reviewers placing RAG support-ratio, LLM faithfulness, nightly eval, and cohort promotion scores.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#faithfulness-support-ratio-scoring-lanes-m-210`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#faithfulness-support-ratio-scoring-lanes-m-210).  
> **FT promotion record:** [`FINE_TUNING_PROMOTION_DECISION_RECORD_CONTRACT.md`](FINE_TUNING_PROMOTION_DECISION_RECORD_CONTRACT.md) (**TB-1292**) — model lane only.  
> **Shared defense plane:** **TB-1230** / **M-212**.  
> **GTM:** **M-209** / **M-210** · **Honesty CI:** **TB-1229**.

---

## Decision in one line

**Three lanes (V1 default):** structural/light-heuristic on execute→commit; semantic/RAG faithfulness **async** by default; cohort ratios for **model promotion** only. Do **not** fuse lanes into one “faithfulness score” that seals the golden manifest.

---

## Lane A — Inline execute→commit (structural + light heuristic)

| Signal | Examples | Runs | Role vs commit |
| --- | --- | --- | --- |
| Structural provenance | Non-empty resolvable provenance (**TB-1221**) | Inline | May block commit when fail-closed |
| Citation / evidence refs floors | Top-level `evidenceRefs`, schema validity | Inline | Execute→commit discipline |
| Light heuristics | `AgentResultEvidenceFaithfulnessChecker` when PilotStrict Enforce/Block | Inline | Heuristic — not semantic legal truth |

**Trade-offs:** Acceptable latency for sync checks; false rejects if semantic LLM judge forced here; PilotStrict≠Real (**M-166**).

**Code anchors:** `AgentOutputQualityGate`, `AgentResultEvidenceFaithfulnessChecker` (when Enforce/Block), PilotStrict config.

---

## Lane B — Async quality signal

| Signal | Examples | Runs | Role vs commit |
| --- | --- | --- | --- |
| RAG output citation coverage | RAG-V1-005 | Async / nightly | **Not** commit gate by default |
| Offline eval | `eval_agent_faithfulness.py`, golden cohort | CI / nightly | Marketing must not treat green as commit safety |
| Retrieval faithfulness | `RetrievalFaithfulnessEvaluator`, embedding cosine | Post-path / OTel | Probabilistic — label HOLD/warn |
| Citation integrity CLI | Ship-gate artifacts | CI | Distinct from per-run seal |

**Trade-offs:** No commit safety by itself; lag vs package seal; needs honest labeling.

**Residual:** `FindingCitationCoverageRatio` inert path — do not cite as live commit gate until **TB-1221** wires validators.

---

## Lane C — Model / config promotion

| Signal | Examples | Runs | Role vs commit |
| --- | --- | --- | --- |
| Golden-cohort support ratios | `GoldenCohortFineTuningPromotionGate` | Promotion decision | **Model lane** — not per-run package safety |
| FT registry ratios | `FineTunedModelRegistryEntry.EvalSupportRatio` | Registry | Promotion evidence only (**TB-1292** for audit-grade record) |

**Trade-offs:** Promotion ≠ per-run manifest safety; cohort window ≠ this-run truth.

---

## V1 default split

| Lane | Default placement |
| --- | --- |
| **A** | Structural provenance + schema/heuristic floors on execute→commit |
| **B** | Semantic / RAG support-ratio async (+ ship-gate / nightly) |
| **C** | Model promotion / FT decisions only |

**Never promise:** semantic faithfulness is the golden-manifest commit gate in V1.

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| RAG-V1-005 / nightly eval / embedding cosine = commit gate | Lane B async; not package seal |
| PilotStrict heuristic floors = semantic legal truth | Lane A discipline only |
| Model-promotion cohort ratios = per-run package safety | Lane C only |
| One fused “faithfulness score” seals the package | Three-lane split |
| PilotStrict green = Real live-model faithfulness proof | **M-166** mode honesty |

---

## Related backlog

| ID | Role |
| --- | --- |
| **TB-1228** | This contract |
| **TB-1229** | Honesty CI |
| **TB-1221** | Structural provenance validators |
| **TB-1230** | Shared plane implements Lane A; B/C stay separate |
| **TB-1292** | FT decision-record fields (Lane C audit) |
| Done **TB-684** / **TB-021** | PilotStrict / eval baselines (not reopened) |
| **G-FAITH-01** | Owner nightly faithfulness program (not flipped here) |
