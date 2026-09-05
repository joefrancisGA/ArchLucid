# Insight-density engine distribution

claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
(penalty reason `typed-engine-scored` for engine origin; legacy `typed-engine-protected` Promote bypass superseded);
checklist rows remain on the package snapshot.
The golden corpus harness registers **16** engines; **15** appear in this table (≥1 finding across case-01..case-35). **24** built-in product engines are absent from this corpus-derived slice.
`WouldDemoteIfUnprotectedCount` matches production demotion when the predicate applies (ADR 0070).

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

| Engine | Findings | Min | Median | Max | Would demote if unprotected |
| --- | --- | --- | --- | --- | --- |
| topology-coverage | 35 | 60 | 60 | 100 | 0 |
| declaration-security-baseline | 3 | 70 | 75 | 100 | 0 |
| compliance | 6 | 100 | 100 | 100 | 0 |
| cost-constraint | 10 | 100 | 100 | 100 | 0 |
| declaration-premise-conflict | 1 | 100 | 100 | 100 | 0 |
| external-exposure | 1 | 100 | 100 | 100 | 0 |
| privileged-access | 1 | 100 | 100 | 100 | 0 |
| requirement | 11 | 100 | 100 | 100 | 0 |
| requirement-coverage | 6 | 100 | 100 | 100 | 0 |
| requirement-expectation | 14 | 100 | 100 | 100 | 0 |
| security-baseline | 11 | 100 | 100 | 100 | 0 |
| security-baseline-completeness | 14 | 100 | 100 | 100 | 0 |
| security-coverage | 8 | 100 | 100 | 100 | 0 |
| security-gap | 10 | 100 | 100 | 100 | 0 |
| trust-boundary | 1 | 100 | 100 | 100 | 0 |

