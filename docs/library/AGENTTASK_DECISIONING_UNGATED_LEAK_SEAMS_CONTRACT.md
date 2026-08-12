> **Scope:** Contributor-reference — mode-blind AgentTask→decisioning leak inventory (**TB-1369**); complements validate-before-overlay (**TB-1196**).

# AgentTask→decisioning ungated leak seams (Real vs Simulator mode-blind matrix) (TB-1369)

> **Audience:** Contributors, principal architects, and GTM reviewers answering *where AgentTask output still influences committed shapes without typed/provenance gates*.  
> **Buyer summary:** [`AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md`](AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md) (**TB-1196**).

**GTM:** **M-247** / **M-248** · **M-203** / **M-204** · **M-166** · **M-207**.  
**Authority vs AgentTask:** [`AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (**TB-1007**).  
**Defense plane:** [`SHARED_HALLUCINATION_DEFENSE_PLANE_CONTRACT.md`](SHARED_HALLUCINATION_DEFENSE_PLANE_CONTRACT.md) (**TB-1230**).  
**Honesty CI:** **TB-1370** (open).

---

## Decision in one line

**Authority typed-findings decide is the intended chokepoint.** Simulator and Real share the **same mode-blind** AgentTask influence seams today — INV-002 labels modes but **does not** add overlay gates. Residual leaks are ranked below; **TB-1196** validate-before-overlay is the target closure for overlay paths.

---

## Ranked leak inventory

| # | Seam | Code path | Simulator vs Real | Gate today | Buyer impact | Residual owner |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Commit graph overlay | `AuthorityDrivenArchitectureRunCommitOrchestrator` → `AgentTopologyProposalGraphMerge.WithMergedTopologyProposals` | **Same** | Schema + merge; no domain provenance gate | Topology/`ReasoningTrace` on nodes may diverge from typed decide | **TB-1196** validate-before-overlay |
| 2 | AgentTask merge / proposal manifest | `DecisionEngineService.MergeResults` → `AgentProposalManifestMerger` (execute/result/commit, replay, golden corpus) | **Same** | `DecisionMergeInputGate` schema-only | Services/datastores/controls merged from proposals | **TB-1196** |
| 3 | Compliance → governance tags lift | `AgentProposalManifestMerger.ApplyFindingsToGovernance` | **Same** | Category filter + `Message` lift | Compliance finding prose → `Governance.ComplianceTags` | **TB-1196** / **TB-1221** |
| 4 | DecisionEngineV2 AcceptPrior | Strategies consume agent calibrated/raw confidence | **Same** | Strategy config | Confidence influences materialized decision nodes | **TB-1196** |
| 5 | Finding dual pipeline | LLM `ArchitectureFinding` + empty `EvidenceRefs` | **Same** | Partial hygiene; not fail-closed per finding | Narrative findings without provenance | **TB-1221** |
| 6 | Critic confidence/density mutation | Post-process without per-finding provenance gate | **Same** | Quality gate may WarnOnly | Density/confidence mutates presentation | **TB-1230** / **TB-1221** |
| 7 | Quality WarnOnly on commit-eligible Real | PilotStrict/quality green without overlay gate | **Same** code path; thresholds differ | Enforce/Block config | **M-166** — green ≠ overlay closed | **TB-1196** |

---

## Pins (do not misstate)

| Misstatement | Correction |
| --- | --- |
| Simulator decide is fail-closed vs Real | **Same** overlay/merge seams; mode label only |
| `DecisionMergeInputGate` = provenance gate | **Schema-only** today |
| Separate Simulator decide stack exists | **No** — shared paths (**TB-1007**) |
| PilotStrict green → overlay safe on Real | **M-166** — disclose residual |

---

## Allow / forbid (GTM-safe)

| Claim | Status |
| --- | --- |
| Ranked mode-blind leak table with code anchors | **Allow** |
| Authority typed-findings decide as chokepoint **intent** | **Allow** |
| Disclose overlay + ComplianceTags lift until **TB-1196** ships | **Allow** |
| Simulator AgentTask→decide gated differently from Real | **Forbid** |
| Schema-validated `AgentResult` = provenance-gated decide input | **Forbid** without **TB-1196**/**TB-1221** |

---

## TB-1370 CI anchors (named, not implemented here)

| Anchor | Purpose |
| --- | --- |
| `AGENTTASK_DECISIONING_UNGATED_LEAK_SEAMS_CONTRACT.md` | Drift guard (this file) |
| Buyer/proof stub guards | Fail mode-split / schema=provenance claims |
| Verification | `AgentTopologyProposalGraphMerge`, `AgentProposalManifestMerger.ApplyFindingsToGovernance`, `DecisionMergeInputGate`, INV-002 labels |

---

## Explicit non-claims

- Does not ship validate-before-overlay (**TB-1196** implementation).
- Does not make Real deterministic or reopen Done **TB-684**.
- Does not close honesty CI (**TB-1370**).

---

## Related

- [`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`](DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md) (**TB-1221**)
- [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**)
