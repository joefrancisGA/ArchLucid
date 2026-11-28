> **Scope:** Contributor guide for the read-only SecureNow remediation dependency graph and its optimizer handoff. This does not prove remediation effectiveness or authorize execution.

# FND-088 evidence-bound remediation graph

The first fixture has two findings with an independently reviewed common cause, one candidate action and one scenario. Both findings and their source references remain visible, but selection returns exactly one scenario ID. Distinct reviewed scenarios under the same cause are not merged.

## Reuse the scoped inputs

`RemediationPortfolioGraphReader.ReadAsync` works at an existing authorized `ProjectSnapshotScopeKey`. It reads the pinned inventory capture, project-scoped finding rows and paths, snapshot-scoped cut points, the tenant's authoritative current approved pattern versions, and active matches bound back to the requested findings. It does not infer authorization from proposal fields. An out-of-scope repository result, a different capture digest, or a different proposal digest rejects the read. Missing rows, retired versions, stale path/snapshot bindings and changed evidence digests do not give coverage credit.

The caller supplies the proposal and its **independently reviewed** digest through a trusted internal boundary. The proposal binds the snapshot identity and inventory hash, policy, engine and risk-model versions, and whether the dependency inventory is complete. Those declared versions and review decisions come from the custodian, not a new approval engine. `ComputeProposalSha256` can prepare a canonical digest for review. Recomputing a digest oneself is not approval. Return only IDs and hash references rather than raw evidence text or pattern content.

Use the existing durable finding IDs, not a display title, to attach findings. A stable action ID includes the exact scope, an approved action-kind identifier, target resource, pattern and version ID. Proposal-local aliases for the same action resolve to one node without dropping provenance. Scenario and root cause identities are distinct scoped keys allocated by the reviewing evidence system. A new capture or policy requires a reviewed proposal and graph pin, not necessarily a new logical action ID.

Existing pattern matches or cut points can nominate candidates. A cut-point candidate must still bind its target, current approved pattern match, and cited path. A candidate is not independently sufficient coverage. A reviewed coverage clause must cite current, scoped scenario evidence. The graph validates the bindings and does not independently prove a proposed effect. The later counterfactual and verification slices own that work.

## Relationship and selection semantics

| Relationship | Meaning |
| --- | --- |
| Prerequisite | Directional from the dependent action to the required action. Every member of the transitive chain must be selected. |
| Conflict | Symmetric and hard. Two conflicting actions cannot both be selected. |
| Alternative | Symmetric metadata for different ways to address a scenario. It is not a conflict unless a conflict is separately declared. |
| Sufficient clause | All named distinct actions are required. Multiple sufficient clauses for the same scenario are alternatives, not additive benefits. |

Cycles, dependencies on cycles, unavailable prerequisites and conflicting prerequisite chains make impacted actions ineligible. Unverified hard constraints block the affected actions instead of being silently dropped. Incomplete snapshot or dependency coverage refuses selection. Unknown scenarios and exclusions carry separate reasons and must not be read as no exposure.

The versioned read-only result exposes canonical actions, causes, scenarios, edges, sufficient clauses, issue codes, source pins and `GraphSha256`. `EvaluateSelection` checks a proposed set and returns the distinct scenario IDs it covers, not a probability, dollar estimate or execution authorization. An infeasible set receives no benefit credit. This is the contract for FND-089, not a solver, budgeting engine, approval workflow or migration of current wave ordering.

## Verification and boundaries

Focused Release tests use a hand-enumerated shared-cause fixture and cases for overlapping benefits, distinct scenarios, joint clauses, aliases, dependency chains, cycles, conflicts, older evidence and cross-scope data. They also verify stable digests for reordered inputs and run existing pattern-match, cut-point, ranking and wave tests. No endpoints, dependency injection registration, persistence schema or live ranking/approval/execution behavior change. FND-083 continues to own analysis invalidation and checkpoint dependencies. [Portfolio design](../architecture/REMEDIATION_PORTFOLIO_OPTIMIZATION.md)
