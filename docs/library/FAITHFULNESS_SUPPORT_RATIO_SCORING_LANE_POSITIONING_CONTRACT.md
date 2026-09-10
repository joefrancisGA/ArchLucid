> **Scope:** Contributor reference — engineering source of truth — where faithfulness / support-ratio scores sit architecturally (**TB-1228**). Prevents fusing inline commit gates, async eval, and model promotion.

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

**Residual:** `FindingCitationCoverageRatio` is live on Working Real PilotStrict (LP-04); Simulator skips ratio evaluation.

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

## AS-065 opt-in: PilotStrict Unsupported hold (Working Real only)

| Control | Default | When on |
| --- | --- | --- |
| `AgentOutput:QualityGate:PilotStrictHoldOnUnsupportedSemanticSupport` | **false** | Working **Real** + host **PilotStrict** holds finalize when any **decision-grade** finding has semantic support band **Unsupported** |
| Simulator / Rehearsal | n/a | **Ignores** the flag — no Unsupported hold |
| UI honesty (flag off) | always | Warn-only strip: Unsupported rows stay visible; finalize stays enabled (TB-1228 default) |

**Code anchors:** `UnsupportedSemanticSupportFinalizeHoldEvaluator`, `CommitOutputIntegrityService`, pre-finalize checklist item `unsupported-semantic-support-hold`, readiness summary `pilotStrictHoldOnUnsupportedSemanticSupport`.

**Trade-offs:** Opt-in fail-closed for tenants that want it; global default-on would false-reject V1 packages. Unsupported band is heuristic — hold is discipline, not semantic legal truth.

**Related:** ADR 0085 (semantic support band on Working desk); AS-064 unchecked warn-only strip.

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

## CI anchors for **TB-1229**

| Anchor | Purpose |
| --- | --- |
| This contract + buyer packet **M-209**/**M-210** | Required cite near faithfulness / support-ratio lane language |
| `scripts/ci/check_faithfulness_support_ratio_scoring_lane_honesty.py` | Fail buyer stubs: semantic faithfulness = commit gate / cohort ratio = package safety / PilotStrict = Real proof |
| Code presence | `AgentOutputQualityGate`, `GoldenCohortFineTuningPromotionGate` |

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
