# Insight-density engine distribution

claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
(penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
The golden corpus harness registers **42** engines; **23** appear in this table (≥1 finding across case-01..case-69). **30** built-in product engines are absent from this corpus-derived slice.
`WouldDemoteIfUnprotectedCount` matches production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59).
`WouldDemoteAt65Count` applies the same predicate at threshold 65; with production default 65 it should match `WouldDemoteIfUnprotectedCount`.

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.
Recorded scores on this corpus do not form a 60/65/75/80/85 ladder; inventory and line-anchored doc bonuses apply only where those anchors exist.
QR-05 (2026-09-09): `security-baseline` now emits `EvidenceRefs` from resolvable node properties; this corpus slice still has no inventory-shaped citations on those nodes, so the row stays median 65 with `No evidence = 10` (fail closed — no invented ARM ids).

| Engine | Findings | Min | Median | Max | Would demote if unprotected | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| declaration-security-baseline | 1 | 65 | 65 | 65 | 0 | 0 | 1 | 1 | 0 | 0 |
| security-baseline | 10 | 65 | 65 | 65 | 0 | 0 | 10 | 10 | 0 | 0 |
| topology-security-drift | 1 | 65 | 65 | 65 | 0 | 0 | 1 | 1 | 0 | 0 |
| dangling-declaration-reference | 1 | 67 | 67 | 67 | 0 | 0 | 1 | 0 | 0 | 0 |
| dr-rpo-topology | 2 | 67 | 67 | 67 | 0 | 0 | 2 | 0 | 0 | 0 |
| requirement-sku-tier | 1 | 67 | 67 | 67 | 0 | 0 | 1 | 0 | 0 | 0 |
| data-flow-trust-boundary | 3 | 72 | 72 | 72 | 0 | 0 | 3 | 0 | 0 | 0 |
| identity-blast-radius | 5 | 72 | 72 | 72 | 0 | 0 | 5 | 0 | 0 | 0 |
| segmentation-semantics | 3 | 72 | 72 | 72 | 0 | 0 | 3 | 0 | 0 | 0 |
| declaration-premise-conflict | 1 | 82 | 82 | 82 | 0 | 0 | 1 | 0 | 0 | 0 |
| aws-inventory-reconciliation | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| azure-inventory-reconciliation | 3 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| azure-inventory-security-baseline | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| declaration-inventory-contradiction | 2 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| gcp-inventory-reconciliation | 2 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| gcp-inventory-security-baseline | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| orphaned-aws-resource | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| orphaned-azure-resource | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| orphaned-gcp-resource | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| requirement-expectation | 2 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| secrets-lifecycle | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| security-baseline-completeness | 2 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| topology-coverage | 2 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |

