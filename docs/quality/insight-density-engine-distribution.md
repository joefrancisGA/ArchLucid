# Insight-density engine distribution

claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
(penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
The golden corpus harness registers **41** engines; **38** appear in this table (≥1 finding across case-01..case-63). **14** built-in product engines are absent from this corpus-derived slice.
`WouldDemoteIfUnprotectedCount` matches production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59).
`WouldDemoteAt65Count` applies the same predicate at threshold 65; with production default 65 it should match `WouldDemoteIfUnprotectedCount`.

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

| Engine | Findings | Min | Median | Max | Would demote if unprotected | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| advisor-cost-recommendation | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| aws-cost-recommendation | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| aws-inventory-security-baseline | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| compliance | 10 | 60 | 60 | 60 | 10 | 0 | 10 | 10 | 0 | 10 |
| cost-constraint | 10 | 60 | 60 | 60 | 10 | 0 | 10 | 10 | 0 | 10 |
| external-exposure | 3 | 60 | 60 | 60 | 3 | 0 | 3 | 3 | 0 | 3 |
| gcp-cost-recommendation | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| privileged-access | 2 | 60 | 60 | 60 | 2 | 0 | 2 | 2 | 0 | 2 |
| requirement | 14 | 60 | 60 | 60 | 14 | 0 | 14 | 14 | 0 | 14 |
| requirement-coverage | 6 | 60 | 60 | 60 | 6 | 0 | 6 | 6 | 0 | 6 |
| requirement-expectation | 31 | 60 | 60 | 85 | 29 | 0 | 29 | 31 | 0 | 29 |
| security-baseline-completeness | 31 | 60 | 60 | 85 | 29 | 0 | 29 | 31 | 0 | 29 |
| security-baseline-expectation | 31 | 60 | 60 | 60 | 31 | 0 | 31 | 31 | 0 | 31 |
| security-coverage | 25 | 60 | 60 | 60 | 25 | 0 | 25 | 25 | 0 | 25 |
| security-gap | 13 | 60 | 60 | 60 | 13 | 0 | 13 | 13 | 0 | 13 |
| topology-anti-pattern | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| topology-coverage | 63 | 60 | 60 | 85 | 61 | 0 | 61 | 63 | 0 | 61 |
| topology-structure | 3 | 60 | 60 | 60 | 3 | 0 | 3 | 3 | 0 | 3 |
| trust-boundary | 1 | 60 | 60 | 60 | 1 | 0 | 1 | 1 | 0 | 1 |
| declaration-security-baseline | 1 | 65 | 65 | 65 | 0 | 0 | 1 | 1 | 0 | 0 |
| security-baseline | 14 | 60 | 65 | 65 | 4 | 0 | 14 | 14 | 0 | 4 |
| dangling-declaration-reference | 1 | 75 | 75 | 75 | 0 | 0 | 1 | 0 | 0 | 0 |
| dr-rpo-topology | 2 | 75 | 75 | 75 | 0 | 0 | 2 | 0 | 0 | 0 |
| requirement-sku-tier | 1 | 75 | 75 | 75 | 0 | 0 | 1 | 0 | 0 | 0 |
| data-flow-trust-boundary | 2 | 80 | 80 | 80 | 0 | 0 | 2 | 0 | 0 | 0 |
| declaration-premise-conflict | 1 | 80 | 80 | 80 | 0 | 0 | 1 | 0 | 0 | 0 |
| identity-blast-radius | 3 | 80 | 80 | 80 | 0 | 0 | 3 | 0 | 0 | 0 |
| segmentation-semantics | 2 | 80 | 80 | 80 | 0 | 0 | 2 | 0 | 0 | 0 |
| aws-inventory-reconciliation | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| azure-inventory-reconciliation | 3 | 85 | 85 | 85 | 0 | 0 | 0 | 3 | 0 | 0 |
| azure-inventory-security-baseline | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| declaration-inventory-contradiction | 2 | 85 | 85 | 85 | 0 | 0 | 0 | 2 | 0 | 0 |
| gcp-inventory-reconciliation | 2 | 85 | 85 | 85 | 0 | 0 | 0 | 2 | 0 | 0 |
| gcp-inventory-security-baseline | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| orphaned-aws-resource | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| orphaned-azure-resource | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| orphaned-gcp-resource | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |
| secrets-lifecycle | 1 | 85 | 85 | 85 | 0 | 0 | 0 | 1 | 0 | 0 |

