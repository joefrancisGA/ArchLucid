# Insight-density engine distribution

claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
(penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
The golden corpus harness registers **38** engines; **32** appear in this table (≥1 finding across case-01..case-54). **18** built-in product engines are absent from this corpus-derived slice.
`WouldDemoteIfUnprotectedCount` matches production demotion when the predicate applies (ADR 0070).

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

| Engine | Findings | Min | Median | Max | Would demote if unprotected |
| --- | --- | --- | --- | --- | --- |
| aws-inventory-reconciliation | 1 | 60 | 60 | 60 | 0 |
| aws-inventory-security-baseline | 1 | 60 | 60 | 60 | 0 |
| azure-inventory-reconciliation | 3 | 60 | 60 | 60 | 0 |
| azure-inventory-security-baseline | 1 | 60 | 60 | 60 | 0 |
| compliance | 6 | 60 | 60 | 60 | 0 |
| cost-constraint | 10 | 60 | 60 | 60 | 0 |
| external-exposure | 2 | 60 | 60 | 60 | 0 |
| gcp-inventory-reconciliation | 2 | 60 | 60 | 60 | 0 |
| gcp-inventory-security-baseline | 1 | 60 | 60 | 60 | 0 |
| orphaned-aws-resource | 1 | 60 | 60 | 60 | 0 |
| orphaned-azure-resource | 1 | 60 | 60 | 60 | 0 |
| orphaned-gcp-resource | 1 | 60 | 60 | 60 | 0 |
| privileged-access | 2 | 60 | 60 | 60 | 0 |
| requirement | 14 | 60 | 60 | 60 | 0 |
| requirement-coverage | 6 | 60 | 60 | 60 | 0 |
| requirement-expectation | 25 | 60 | 60 | 60 | 0 |
| security-baseline-completeness | 25 | 60 | 60 | 60 | 0 |
| security-coverage | 19 | 60 | 60 | 60 | 0 |
| security-gap | 13 | 60 | 60 | 60 | 0 |
| topology-coverage | 54 | 60 | 60 | 60 | 0 |
| trust-boundary | 1 | 60 | 60 | 60 | 0 |
| declaration-security-baseline | 1 | 65 | 65 | 65 | 0 |
| security-baseline | 14 | 60 | 65 | 65 | 0 |
| declaration-premise-conflict | 1 | 80 | 80 | 80 | 0 |
| declaration-inventory-contradiction | 1 | 85 | 85 | 85 | 0 |
| secrets-lifecycle | 1 | 85 | 85 | 85 | 0 |
| dangling-declaration-reference | 1 | 100 | 100 | 100 | 0 |
| data-flow-trust-boundary | 1 | 100 | 100 | 100 | 0 |
| dr-rpo-topology | 2 | 100 | 100 | 100 | 0 |
| identity-blast-radius | 2 | 100 | 100 | 100 | 0 |
| requirement-sku-tier | 1 | 100 | 100 | 100 | 0 |
| segmentation-semantics | 2 | 100 | 100 | 100 | 0 |

