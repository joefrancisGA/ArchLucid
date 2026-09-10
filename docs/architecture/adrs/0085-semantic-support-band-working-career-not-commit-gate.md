> **Scope:** ADR 0085 — Semantic support is a Working career band, not a sync commit gate (architecture-spine AS-056 / TB-1228 Lane B visibility).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0085: Semantic support is a Working career band, not a sync commit gate

- **Status:** Proposed
- **Date:** 2026-09-09
- **Owner decision:** TB-1228 three lanes stay — Working surfaces show a per-finding **support band**; structural provenance (ADR 0082) remains the persist gate; default finalize **warns** on Unchecked, does not block on LLM faithfulness (AS-056 / wave 22 semantic cluster)

## Context

Architects defend **cited findings that follow from the evidence**. ADR 0082 closes the structural hole — decision-grade rows need ProvenanceKind A or B before persist/commit eligibility. Structural refs prove **where** a claim points, not **whether** the cited text actually supports the finding sentence.

TB-1228 rejected fusing semantic/RAG faithfulness into a **sync LLM judge on commit** — false rejects on paraphrase, latency, and correlated model failure. [`FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md`](../../library/FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md) records the durable three-lane split:

| Lane | Role |
|------|------|
| **A — Inline execute→commit** | Structural provenance + schema/heuristic floors (ADR 0082) |
| **B — Async quality signal** | RAG support-ratio, retrieval faithfulness, nightly eval — **not** package seal by default |
| **C — Model promotion** | Golden-cohort ratios for FT decisions only |

**Livelihood risk:** A finding with real citations can still be **Unsupported** semantically — e.g. quote mismatch, invented regulation, or paraphrase the architect cannot defend in ARB. That risk is **career-surface honesty**, not a reason to block seal on every Working finalize with an LLM faithfulness score.

**Related (not rewritten):** ADR 0070 (insight-density demotion — separate predicate), ADR 0078 (career artifact honesty), ADR 0082 (structural provenance fail-closed), ADR 0084 (diagram/inventory decide inputs), TB-1228 / TB-1229, `AgentOutputQualityGate`, `AgentResultEvidenceFaithfulnessChecker`, `RetrievalFaithfulnessEvaluator`, `GoldenCohortFineTuningPromotionGate`.

## Decision

1. **Three lanes unchanged:** TB-1228 Lane A/B/C positioning is authoritative. This ADR does **not** move RAG support-ratio, embedding cosine, or nightly eval onto the default golden-manifest commit gate.
2. **Per-finding support band on Working career surfaces:** Each decision-grade row on Working desk and career export paths may display a **support band** with exactly these values: **Supported**, **Unchecked**, **Unsupported**, **NotScored**.
3. **Structural provenance stays the persist gate:** ADR 0082 ProvenanceKind A/B remains required for decision-grade persist/commit eligibility. Empty or unresolvable citations are a **provenance** problem — not scored as Unsupported by the semantic band scorer (AS-057+).
4. **Semantic band is not insight-density:** ADR 0070 demotion predicate is unchanged. Support band must **not** be fused into `DeterministicInsightDensityGate` or used as a substitute demotion signal (AS-066).
5. **Default finalize posture:** Unchecked band → **warn** on finalize/export honesty surfaces; **does not block** seal by default. Unsupported band → visible on Working; **does not delete** the finding and **does not** silently demote to advisory.
6. **Optional PilotStrict hold (later):** Working Real PilotStrict may optionally **hold** on Unsupported — **default off** (AS-065). Until that ships, answer to “may we block seal on LLM faithfulness?” is **No**.
7. **Scorer waves are follow-on:** AS-057 ships a deterministic quote-overlap heuristic (no LLM). AS-058 keeps async support-ratio in Lane B. AS-074 documents default-off premium LLM judge if ever wired. This ADR records the contract only — **no scorer in AS-056**.

## Trade-offs

**Gains:** PR review can answer “may we block seal on LLM faithfulness?” with one ADR (**No** by default); architects see semantic risk beside structural citations without false-reject commit blocks; TB-1228 lanes stay legible on the desk; Unsupported findings remain visible for ARB defense rather than silent deletion; PilotStrict opt-in preserves buyer honesty without flipping Simulator default Mode.

**Sacrifices:** Heuristic scorer will mark paraphrase **Unchecked** — desk noise until async Lane B or human review; warn-on-Unchecked finalize adds friction without hard enforcement; support band is **not** legal truth or auditor conclusion; GTM must not claim semantic band proves conformity; separate implementation waves (AS-057–AS-075) required before band is live on wire.

**Rejected:** Sync LLM judge on every commit; fusing semantic faithfulness into insight-density demotion; treating RAG-V1-005 / nightly eval green as package seal; cohort promotion ratios as per-run safety; deleting Unsupported rows; claiming support band = semantic legal truth; flipping `AgentExecution:Mode` default from Simulator to Real; unsealing to rescore findings.

## Constraints

- **Do not** rewrite Accepted ADR bodies 0067–0084 except **Related** pointers in follow-on PRs.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from **Simulator** to Real — career vs rehearsal is product chrome (ADR 0086 / AS-076+), not a host-config flip (G-REAL-06 out of scope).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars or finding-comment chat.
- **Do not** claim semantic support band is **legal truth**, auditor conclusion, or CPA-grade conformity.
- **Do not** make RAG support-ratio, retrieval faithfulness eval, or LLM judge the **default commit gate** — Lane B stays async unless explicit PilotStrict opt-in (AS-065).
- **Do not** fuse support band into ADR 0070 insight-density demotion (AS-066).
- **TB-645 vocabulary** on operator-facing band copy. **TB-2005** on any new form surfaces.
- Terraform for net-new infra — band display and async jobs follow existing API/UI patterns; no net-new collection resources.

## Expected impact

**System:** AS-057–AS-075 add heuristic scorer, wire enum, desk bands, async Lane B job, honesty CI, and optional PilotStrict hold. Working career surfaces gain per-finding semantic posture without changing default commit classifier behavior.

**Security:** Fail-closed structural provenance (0082) unchanged — semantic band does not weaken citation requirements; async Lane B scores do not exfiltrate tenant data beyond existing eval paths; default-off LLM judge (AS-074) limits prompt-injection surface on commit hot path. Support band labels reduce authority-borrowing where cited text does not support claims.

**Operations:** Support distinguishes provenance hold (0082) vs Unchecked paraphrase vs Unsupported quote mismatch; on-call runbooks cite 0085 + TB-1228 contract; honesty CI (TB-1229 / AS-067) guards overclaims that semantic band = seal safety.

**Cost:** Engineering time for AS-057–AS-075; negligible runtime for heuristic scorer; async Lane B jobs billed only when enqueued; no default sync LLM judge cost on commit.

**Teams:** Principal architects get defendable “why is this Unchecked?” narrative; GTM must cite TB-1228 lanes and must not promise faithfulness commit gate (M-209/M-210); insight-density owners keep separate demotion logic (0070).

## Consequences

- **Positive:** 0085 becomes the merge-blocking question for “block seal on LLM faithfulness?”; wave 22 semantic cluster can parallel inventory bind after 0084; TB-1228 gains an ADR anchor for desk visibility.
- **Negative:** 0085 alone is contract-only — no band on wire until AS-059; heuristic misses paraphrase by design; warn-only finalize may feel weak until PilotStrict opt-in ships.
- **Follow-ups:** AS-057 heuristic quote-overlap scorer; AS-058 async support-ratio job; AS-059 support band enum; AS-065 PilotStrict optional hold on Unsupported; AS-066 do-not-fuse insight-density (**ratchet:** `ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests`); AS-067 honesty CI not legal truth; AS-074 LLM judge default off; AS-075 semantic contract doc completeness.

## Follow-up (AS-066)

**Ratchet shipped:** `DeterministicInsightDensityGate.Score` and `InsightDensityGateCandidate` do **not** read `Finding.SemanticSupportBand`. Unit test `Score_ignores_semantic_support_band_on_source_finding` proves band changes do not alter score/treatment/classification; architecture tests guard the gate source from reintroducing band coupling.

**Why sibling signals:** Cited-but-paraphrased rows can stay decision-grade under ADR 0070 while showing **Unchecked** or **Unsupported** on Working — fusing band into density demotion would hide semantic risk inside checklist coverage.
