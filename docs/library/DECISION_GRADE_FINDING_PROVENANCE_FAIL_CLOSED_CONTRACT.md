> **Scope:** Contributor-reference — structural fail-closed provenance for decision-grade findings (TB-1221); not a buyer assurance claim or semantic-faithfulness guarantee.

# Decision-grade finding provenance fail-closed (TB-1221)

> **Audience:** Contributors, principal architects, and GTM claim reviewers evaluating citation-bound / evidence-grounded finding language.  
> **Not** a buyer assurance claim — this contract names **architectural** gates, not prompt compliance or LLM semantic faithfulness.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#decision-grade-finding-provenance-m-208) (GTM **M-207** / **M-208**).  
**Path-stable alias:** [`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_PA_ONE_PAGER.md`](../go-to-market/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_PA_ONE_PAGER.md).  
**Committed package unit of truth:** [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**).  
**Prose quarantine / validate-before-overlay:** **TB-1196** (open).  
**Honesty CI:** **TB-1222** Done.  
**Semantic faithfulness lane:** **TB-1228** / GTM **M-209**/**M-210** — separate from structural provenance.

---

## Decision in one line

**Decision-grade** findings must carry **structural** provenance (`ProvenanceKind`) before emission and before commit-eligible Real paths treat them as governance inputs. Prompt instructions, Critic Low labels, insight-density demotion, and top-level `AgentResult.EvidenceRefs` are **not** substitutes. **Checklist / advisory** findings are explicitly exempt.

---

## Today vs target (honest baseline)

| Surface | Today (V1 baseline) | Target (contract pins) |
|---------|---------------------|------------------------|
| `ArchitectureFinding.EvidenceRefs` | May be `[]`; schema-valid | Decision-grade agent findings require non-empty resolvable refs **or** hold/reject at emission |
| Authority `Finding` / typed engines | `RelatedNodeIds` + `RulesApplied` on engines; no uniform provenance validator | Typed path: non-empty graph/rule provenance for decision-grade |
| `FindingPayloadValidator` | Payload shape only | Extend or add `IFindingProvenanceValidator` for decision-grade |
| `FindingsOrchestrator` | Validates payload; insight-density gate | Apply provenance validator before persist |
| `AgentResultParser` post-parse | Schema parse | Reject/hold decision-grade LLM findings lacking `ProvenanceKind` |
| `FindingClaimCoverageEvaluator` | Computes ratio; logs | **Not** a commit gate today |
| `AgentOutputSemanticScore.FindingCitationCoverageRatio` | Field exists; **inert in production** | Wire into PilotStrict Enforce/Block when **TB-1221** gates ship |
| Critic / Low confidence | Labels heuristic findings | **Not** proof of citation |
| `Message` → `ComplianceTags` lift | Uncited prose can lift | Quarantine unless provenance passes (**TB-1196**) |

This contract **publishes** the matrix and gate names. Validator wiring and commit enforcement are follow-on ships — do not claim they are live until implemented.

---

## Finding tiers (what the contract applies to)

| Tier | `FindingClassification` / signal | Provenance contract |
|------|----------------------------------|---------------------|
| **Decision-grade** | `DecisionGradeFinding` (default when unset on agent path) | **Required** `ProvenanceKind` |
| **Checklist coverage** | `ChecklistCoverage` | **Exempt** — may emit without decision-grade provenance |
| **Advisory / heuristic** | Low confidence, insight-density demoted, explicit advisory tier | **Exempt** from fail-closed decision-grade rule; must not be sold as citation-bound |

---

## ProvenanceKind (decision-grade)

| Kind | Pipeline | Structural requirement | Resolves to |
|------|----------|------------------------|-------------|
| **A — Typed engine** | `IFindingEngine` → authority `Finding` | Non-empty `RelatedNodeIds` **and** non-empty `RulesApplied` (or engine-specific payload trace) | Graph node IDs + rule IDs in sealed manifest / topology |
| **B — Agent LLM** | `AgentResultParser` → `ArchitectureFinding` | Non-empty per-finding `EvidenceRefs` **or** per-finding citations mapped from `AgentResult.Citations` / `AgentExecutionTrace.Citations` that resolve to sealed evidence package / allowlisted ref prefixes | Evidence package rows / allowlisted URI prefixes |
| **C — Exempt** | Checklist / advisory | No decision-grade provenance required | N/A |

**Not ProvenanceKind:** prompt text, Critic confidence, `AgentResult.EvidenceRefs` alone (run-level bag), insight-density score, `TrustLabel` strings.

---

## Emission gate (named, follow-on implementation)

| Gate | Owner | Apply at |
|------|-------|----------|
| `IFindingProvenanceValidator` (or extend `IFindingPayloadValidator`) | Decisioning | `FindingsOrchestrator` before typed finding persist |
| Agent finding provenance check | AgentRuntime | Post-`AgentResultParser`, pre-persist of `ArchitectureFinding` list |
| Hold / reject disposition | AgentRuntime + Decisioning | Quarantine finding row or strip from decision-grade surfaces |

**Fail-closed rule:** decision-grade finding without Kind **A** or **B** → **reject or hold** — never silently persist as decision-grade.

---

## Commit gate (named, follow-on implementation)

| Gate | Owner | When |
|------|-------|------|
| `FindingCitationCoverageRatio` / unsupported IDs | `AgentOutputQualityGate` + PilotStrict | Real commit-eligible runs when Enforce/Block on |
| Provenance validator (replay) | Decisioning | Pre-commit findings snapshot seal |
| Prose quarantine | **TB-1196** | `Message` → `ComplianceTags` only when provenance passes |

Commit does **not** today require per-finding provenance — buyers must not be told otherwise until gates ship.

---

## Dual pipeline map

| Pipeline | Primary types | Provenance today | Contract pin |
|----------|---------------|------------------|--------------|
| Typed engines | `Finding`, engine payloads | `RelatedNodeIds`, `RulesApplied` | Kind **A** required for decision-grade |
| LLM agents | `ArchitectureFinding` | Optional `EvidenceRefs` | Kind **B** required for decision-grade |
| Merge / governance lift | `AgentProposalManifestMerger` | Schema-only merge gate | Provenance + **TB-1196** before ComplianceTags lift |

**Code anchors (verification):** `FindingFactory`, `FindingsOrchestrator`, `FindingPayloadValidator`, `AgentResultParser`, `FindingClaimCoverageEvaluator`, `AgentOutputQualityGate`, `AgentProposalManifestMerger.ApplyFindingsToGovernance`.

---

## Allow / forbid (GTM-safe)

| Claim / pattern | Status |
|-----------------|--------|
| Decision-grade needs structural ProvenanceKind + emission/commit gates (**when shipped**) | **Allow** |
| Checklist / advisory findings exempt from decision-grade provenance | **Allow** |
| Disclose empty `EvidenceRefs` residual until gates ship | **Allow** |
| All findings are citation-bound / evidence-grounded | **Forbid** (while empty refs can emit) |
| Critic Low or top-level agent refs = per-finding guarantee | **Forbid** |
| Prompt instructions = fail-closed provenance | **Forbid** |
| Committed package proves every finding is cited | **Forbid** |
| Semantic faithfulness score = structural provenance | **Forbid** — see **TB-1228** |

---

## CI anchors for **TB-1222**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_decision_grade_finding_provenance_honesty.py` | Fail all-findings-evidence-grounded / empty-EvidenceRefs-as-proof overclaims |
| `DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md` | Drift guard (this file) |
| `FindingFactory` / `AgentResultParser` / `AgentOutputQualityGate` | Verification cite list |
| `FindingCitationCoverageRatio` | Inert until emission/commit gates ship |

Honesty CI shipped: **TB-1222**.

---

## Explicit non-claims

- Semantic faithfulness of cited text (RAG-V1-005 / LLM-as-judge) — probabilistic, separate lane.
- Ask / chat narratives are citation-bound.
- Real LLM outputs are deterministic.
- Reopens Done provenance forensics (**TB-033**–**TB-037**).
- This contract alone enables emission/commit gates — implementation is follow-on.

---

## Related

- [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) · **TB-1003**
- [`APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md`](APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) · **TB-1009**
- [`BUYER_SECURITY_PROCUREMENT_PACKET.md#decision-grade-finding-provenance-m-208`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#decision-grade-finding-provenance-m-208) · GTM **M-207**/**M-208**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1221**–**TB-1222** · **TB-1196** · **TB-1228**
