# Insight-density engine distribution

claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
(penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
The golden corpus harness registers **32** engines; **16** appear in this table (≥1 finding across case-01..case-37). **29** built-in product engines are absent from this corpus-derived slice.
`WouldDemoteIfUnprotectedCount` matches production demotion when the predicate applies (ADR 0070).

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

| Engine | Findings | Min | Median | Max | Would demote if unprotected |
| --- | --- | --- | --- | --- | --- |
| compliance | 6 | 60 | 60 | 60 | 0 |
| cost-constraint | 10 | 60 | 60 | 60 | 0 |
| external-exposure | 1 | 60 | 60 | 60 | 0 |
| privileged-access | 2 | 60 | 60 | 60 | 0 |
| requirement | 11 | 60 | 60 | 60 | 0 |
| requirement-coverage | 6 | 60 | 60 | 60 | 0 |
| requirement-expectation | 15 | 60 | 60 | 60 | 0 |
| security-baseline-completeness | 15 | 60 | 60 | 60 | 0 |
| security-coverage | 9 | 60 | 60 | 60 | 0 |
| security-gap | 10 | 60 | 60 | 60 | 0 |
| topology-coverage | 37 | 60 | 60 | 60 | 0 |
| trust-boundary | 1 | 60 | 60 | 60 | 0 |
| declaration-security-baseline | 1 | 65 | 65 | 65 | 0 |
| security-baseline | 11 | 60 | 65 | 65 | 0 |
| declaration-premise-conflict | 1 | 80 | 80 | 80 | 0 |
| declaration-inventory-contradiction | 1 | 85 | 85 | 85 | 0 |

