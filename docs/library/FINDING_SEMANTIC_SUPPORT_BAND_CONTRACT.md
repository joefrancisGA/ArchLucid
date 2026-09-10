> **Scope:** Contributor reference — PA-facing contract for per-finding **semantic support band** on Working career surfaces (**AS-075** / ADR **0085**). Answers “what does **Supported** mean?” without conflating lanes.

# Finding semantic support band contract (ADR 0085 / TB-1228)

> **Audience:** Principal architects, contributors, and GTM reviewers explaining support-band chips on the Working desk, career exports, and finalize honesty strips.  
> **ADR:** [`0085-semantic-support-band-working-career-not-commit-gate.md`](../architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md).  
> **Lane split (authoritative):** [`FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md`](FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md) (**TB-1228**).  
> **Honesty CI:** **TB-1229** / **AS-067** — support band is **not** legal truth or semantically verified seal.

---

## Decision in one line

**Semantic support band** is a **Working career honesty signal** beside structural citations — **not** the golden-manifest commit gate, **not** insight-density demotion, and **not** semantic legal truth.

---

## Enum (wire + UI)

| Band | Meaning | Typical cause |
| --- | --- | --- |
| **Supported** | Claim text **exactly overlaps** cited excerpt text under the deterministic heuristic scorer (AS-057). | Quote or near-verbatim span found in `EvidenceRefs` excerpts. |
| **Unchecked** | Citations exist but overlap is **partial**, or async Lane B score is **missing** (AS-058). | Paraphrase, pending eval row, or heuristic token overlap without exact quote. |
| **Unsupported** | Citations exist but claim **contradicts** or is **disjoint** from cited excerpts (AS-057 / AS-073 livelihood exhibit). | Quote mismatch — finding stays **decision-grade**; band is visible, not deleted. |
| **NotScored** | No scoreable citation excerpts, or row is **checklist coverage** (ADR 0082 provenance problem, not semantic Unsupported). | Empty/unresolvable refs, checklist band, or Simulator rehearsal presentation (AS-068). |

**What Supported does *not* mean:** auditor attestation, CPA conclusion, RAG nightly eval green, cohort promotion ratio, or “semantically verified seal.”

---

## Scorer (default path — zero LLM)

| Item | Value |
| --- | --- |
| **Lane** | TB-1228 **Lane A-adjacent** heuristic on sync emit (not commit gate) |
| **Implementation** | `FindingSemanticSupportBandScorer` (AS-057) |
| **Version stamp** | `as057-v1` (`FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1`) |
| **Inputs** | Finding claim (`Rationale` / title) vs trimmed `EvidenceRefs` excerpt strings |
| **Rules** | Exact quote span → **Supported**; zero token overlap → **Unsupported**; partial overlap → **Unchecked**; empty citations → **NotScored** (provenance, not Unsupported) |
| **Premium LLM judge** | **Default off** — `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudge` (**AS-074**). Heuristic remains default until explicit opt-in and a wired judge. |

**Code anchors:** `FindingSemanticSupportBandEmissionApplicator`, `FindingSemanticSupportBandOverlayScoring`, `finding-semantic-support-band-export.ts` (`FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION`).

---

## Lane B async (may lag — not Supported by default)

When `AgentOutputSemanticScore` rows exist on agent traces (`FindingCitationCoverageRatio` / `AgentResultFaithfulnessSupportRatio`), read paths compose Lane B into the Working band via `IFindingSemanticSupportBandLaneBComposeService` (AS-058).

| State | Working band |
| --- | --- |
| Lane B row **present** | Composed async score |
| Lane B row **missing** | **Unchecked**, not Supported |
| Execute / merge hot path | Does **not** enqueue or await Lane B jobs |

**Honesty copy:** “Semantic support is async and may lag the sealed review.”

---

## Finalize posture: warn vs hold

| Signal | Default (TB-1228) | Opt-in (AS-065) |
| --- | --- | --- |
| **Unchecked** | **Warn** on finalize/export honesty — does **not** block seal | unchanged |
| **Unsupported** | **Visible** on Working — does **not** delete or demote to checklist solely for mismatch (AS-066 / AS-073) | Working **Real** + **PilotStrict** may **hold** finalize when `AgentOutput:QualityGate:PilotStrictHoldOnUnsupportedSemanticSupport` is **true** (default **false**) |
| **Structural provenance fail** | ADR **0082** persist gate — separate from band | unchanged |

**Code anchors:** `semantic-support-band-finalize-honesty.ts`, `UnsupportedSemanticSupportFinalizeHoldEvaluator`, `CommitOutputIntegrityService`.

---

## Simulator / Rehearsal (AS-068)

Simulator and Fallback structural execution modes must **not** display career-looking **Supported** chips.

| Mode | Presentation |
| --- | --- |
| **Real** Working | Wire band with TB-645 labels |
| **Simulator / Rehearsal** | **NotScored** or “Rehearsal — not career support” — never green Supported from wire |

**Code anchor:** `simulator-career-honesty.ts` → `presentDecisionGradeSemanticSupportBand`.

---

## Insight-density non-fusion (AS-066)

`DeterministicInsightDensityGate` does **not** read `Finding.SemanticSupportBand`. Band and ADR 0070 demotion are **sibling signals**:

- A row may stay **decision-grade** under insight-density while showing **Unchecked** or **Unsupported** on the desk.
- Band must **not** silently demote to checklist coverage.

**Ratchet:** `ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests`.

---

## Honesty examples

| Situation | Band | Safe explanation |
| --- | --- | --- |
| ARM excerpt says “deny public database ingress”; finding claims “allows public internet access” | **Unsupported** | Cited but contradicts excerpt — livelihood exhibit (AS-073). |
| Finding paraphrases citation without exact quote | **Unchecked** | Heuristic cannot confirm — not a provenance failure. |
| Finding sentence appears verbatim in citation excerpt | **Supported** | Heuristic quote overlap only — not legal proof. |
| `EvidenceRefs` empty on decision-grade row | **NotScored** (+ provenance hold) | Structural ADR 0082 problem — not Unsupported. |
| Simulator screenshot with wire **Supported** | **NotScored** / rehearsal label | Rehearsal does not judge Real citation overlap (AS-068). |
| Nightly eval / RAG ratio green | *(not the band)* | Lane B async — does not upgrade seal safety (**TB-1228**). |

### Forbidden claims

| Too strong | Safe |
| --- | --- |
| Support band = semantically verified seal | Working heuristic + optional async Lane B |
| **Unsupported** → row deleted or hidden | Visible on desk; optional PilotStrict hold only |
| **Supported** = auditor-approved conformity | Quote overlap heuristic only |
| RAG / LLM faithfulness = default commit gate | Structural provenance (0082); band warns, does not block by default |
| Band fused into insight-density demotion | Separate predicates (AS-066) |

---

## Related implementation ratchets

| AS | Ratchet / exhibit |
| --- | --- |
| **056** | `ArchitectureSpineAs056SemanticSupportAdrArchitectureTests` |
| **057** | `FindingSemanticSupportBandScorerTests` |
| **058** | `ArchitectureSpineAs058AsyncSupportRatioArchitectureTests` |
| **066** | `ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests` |
| **068** | `simulator-career-honesty` presenter tests |
| **073** | `ArchitectureSpineAs073HeuristicMismatchArchitectureTests` |
| **074** | `ArchLucid:Findings:SemanticSupportBand:EnableLlmJudge` default **false** (ADR 0085 follow-ups) |
| **075** | `ArchitectureSpineAs075SemanticContractDocArchitectureTests` (this document) |

---

## Related backlog

| ID | Role |
| --- | --- |
| **TB-1228** | Three-lane faithfulness positioning (parent contract) |
| **TB-1229** | Honesty CI — band ≠ seal truth |
| **TB-1221** | Structural provenance (persist gate) |
| **ADR 0082** | ProvenanceKind A/B |
| **ADR 0070** | Insight-density demotion (separate) |
| **ADR 0085** | Support band on Working career surfaces |
