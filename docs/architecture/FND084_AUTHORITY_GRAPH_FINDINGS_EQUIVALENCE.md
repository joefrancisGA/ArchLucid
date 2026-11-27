# FND-084 first slice: Authority graph-to-findings equivalence

Status: proposed design. The first executable slice is shadow-only and depends on the shared planner in [FND-083 PR #8358](https://github.com/joefrancisGA/ArchLucid/pull/8358). This proposal does not authorize reuse, move a checkpoint, or change a published finding.

## Decision

An exact checkpoint answers whether the scoped, fenced output still exists and is the one the run admitted. A semantic witness answers whether a specific downstream consumer would receive the same meaningful input after a verified upstream rebuild. Keep the witnesses separate. Two matching semantic digests never make an invalid or missing exact checkpoint valid.

Start at the Authority graph-to-findings edge, with a versioned projection for **one reviewed deterministic consumer**, not the full findings stage. Evaluate `TopologyAntiPatternFindingEngine` as the first candidate. It derives candidate findings from topology-resource categories, labels, the stored `publicEndpoint` property and target membership for specific link types. Its emission order follows the graph's node order, so comparing its output as a multiset in shadow does **not** establish that merge, curation or publication can ignore order. No consumer, including this candidate, qualifies for use in enforcement merely because its name appears here.

## What the current code establishes

| Boundary | Observed behavior | Implication |
| --- | --- | --- |
| Graph creation | [GraphSnapshotCanonicalFingerprint](../../ArchLucid.Core/Persistence/Graph/GraphSnapshotCanonicalFingerprint.cs) and [GraphSnapshotReuseEvaluator](../../ArchLucid.Core/Persistence/Graph/GraphSnapshotReuseEvaluator.cs) compare context and its producing knowledge model to decide whether to build or clone a graph. | Reuse existing deterministic fingerprint primitives where suitable. Do not repurpose context or review-cache equivalence as evidence about findings. |
| Finding input | [AuthorityPipelineFindingsStage](../../ArchLucid.Application/Runs/Orchestration/Pipeline/Stages/AuthorityPipelineFindingsStage.cs) builds a separate analysis context and [materializes pinned evidence](../../ArchLucid.Application/Runs/Orchestration/Pipeline/EvidenceGraphMaterializer.cs). [FindingsOrchestrator](../../ArchLucid.Decisioning/Services/FindingsOrchestrator.cs) also stamps context, then applies policy before engine invocation. | Observe the actual input presented to the reviewed engine, after materialization and stamping. A digest computed only from the prior persisted graph has not bound that input. |
| Order and provenance | [DataFlowTrustBoundaryPathAnalyzer](../../ArchLucid.Decisioning/Analysis/DataFlowTrustBoundaryPathAnalyzer.cs) builds neighbor lists in edge order, visits each node/boundary state once, and retains concrete path node IDs. In a diamond where either intermediate leads to the same destination with the same boundary state, reordering edges can select a different evidence path. | Preserve graph order for unreviewed consumers. Same topology does not establish the same evidence or first-hit decisions. Do not normalize whole-graph node or edge order by default. |
| Output identity | [FindingsMergeAndGateStage](../../ArchLucid.Decisioning/Services/Findings/FindingsMergeAndGateStage.cs) writes the exact run, context and graph IDs into the findings snapshot. [AuthorityPipelineStageContextHydrator](../../ArchLucid.Application/Runs/Orchestration/Pipeline/AuthorityPipelineStageContextHydrator.cs) loads those artifacts through scoped snapshot reads. | Never relabel an old findings snapshot, copy its status to another run, or replace an exact checkpoint binding with a semantic digest. If a future implementation reuses pure observations, the normal pipeline must still emit a new correctly anchored result and rerun its gates. |

## Witness contract

- **Scope and version.** Bind the existing validated project scope and an unsealed Authority run, the specific producer-to-consumer edge, graph schema, projection version, deployed engine version and the supported evaluation mode. No cross-run or cross-project reuse in the first slice.
- **Effective inputs.** Include current scoped context, policy, evidence identity, coverage/freshness, lineage, relevant tenant controls, engine configuration and any other inputs used by the reviewed engine. Preserve the exact prior/current artifact references separately for validation. If materialization, policy, engine applicability or other required evidence cannot be independently established, comparison is inconclusive.
- **Canonical projection.** Use a typed, immutable projection and deterministic ordinal encoding with explicit null/presence markers. Preserve case, direction, strength, multiplicity and provenance wherever the consumer can observe them. Preserve unknown fields and ordering by default or reject unsupported input. Exclude only fields justified by the consumer and tests. Do not introduce a normalization of free-form evidence or an LLM equivalence judge.
- **Outcome.** Return one of `equivalent_for_consumer`, `different`, or `inconclusive`, with stable reason codes. Incomplete or unavailable coverage, an ambiguous graph, stale inputs, or any version/scope mismatch cannot produce an equivalence claim. Non-graph invalidation remains independent of the graph comparison.
- **Authority separation.** In shadow, a typed observation may record a candidate match and an independent comparison result, but it must not return or receive any handle that can approve reuse. The FND-083 planner, exact checkpoint validation and transaction fences remain the sole control path.

## Implementation sequence after FND-083 lands

1. Confirm the final planner seam and graph-bound stage audit format on `master`. Trace the candidate's direct inputs and the graph transformations that precede it. Freeze a versioned projection and explicitly document each excluded field.
2. Add the comparator at the reviewed consumer boundary. It receives only validated, immutable inputs from scoped reads or in-memory fixtures. Use existing exact-witness and structured logging helpers. Shadow is opt-in and does not modify the graph, run or checkpoint. Log versions, outcome, safe reason and bounded timing or workload metrics. Never log raw policy, graph properties, finding text or evidence. Use no new broad capture/replay store to support this slice.
3. Compare using equivalent synthetic graph pairs and known differences. Run the real reviewed engine independently on both inputs under the same pinned context and compare candidate result multisets, including severity and evidence/provenance. Where two scoped, verifiable inputs or independent outputs are not available, log inconclusive. Limit any extra runs to deterministic, resource-bounded rehearsal with no external provider calls, writes or changes to existing artifacts.
4. Keep checkpoint work and finalization intact in all shadow outcomes. Check the effect of candidate ordering on merge/deduplication, classification, evidence anchors and coverage separately. A match at one engine does not make the whole findings stage eligible for optimization.
5. Consider enforcement only as a later, separately verified change. It would stop propagation solely across explicitly verified edges, retain exact checks and transaction fences, and recompute every other branch normally. Advance only when the consumer and output contract prove that its exact downstream inputs and audit lineage remain correct.

## Acceptance cases for shadow

| Case | Expected outcome |
| --- | --- |
| Identical pinned input and exact evidence, observed by the same reviewed engine version | Equivalent for that consumer when independent execution agrees. |
| Reordered input proposed as equivalent | Equivalent only for a consumer whose projection and independent output prove order immaterial. A changed chosen path or evidence witness is a negative control. |
| Meaningful permission, edge direction/weight, relationship, evidence pin, provenance, freshness or coverage changes | Different or inconclusive. Never eligible to stop propagation. |
| Unknown extension, malformed graph, ambiguous identifiers, absent or partial evidence, unsupported version or scope mismatch | Inconclusive. Follow the existing recompute/block path without access widening. |
| Checkpoint removed or replaced while comparing, or shadow comparator unavailable | Exact verification and publication still follow the existing fenced path. Never reuse because a candidate digest matches. |

## Scope and verification

This design preserves [INV-001, INV-003, INV-005, INV-008, INV-011 and INV-013](../library/ARCHITECTURE_INVARIANTS.md), the separate historical replay contract, and FND-077's coverage honesty requirements. It does not change interfaces, DI, CI gates, runtime flags, app behavior, storage, or authorization. SecureNow, automated early termination, and cross-snapshot equivalence are outside the first shadow slice. FND-086 still owns evidence for narrower changed-inventory reuse.

Design review basis: `master` at `d1a53f2ed5dc96e70a0c0721e2730e4fb2534276` and the observed FND-083 PR head `343cc5a5458b318127e5f3f6305ed0b5ab7d662a`. Source trace and the diamond reasoning above are design evidence, not an executed product regression. No runtime comparisons have been run for this design change.
