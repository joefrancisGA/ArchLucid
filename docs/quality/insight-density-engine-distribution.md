# Insight-density engine distribution

claimBoundary: Advisory-only measurement — scores do **not** demote typed-engine findings in production.
DeterministicInsightDensityGate returns Promote / DecisionGradeFinding for non-agent findings
(penalty reason `typed-engine-protected`); the computed score is visible here but is not a control.
This corpus exercises **six** golden-corpus engines; **33** built-in engines are absent from the table.
`WouldDemoteIfUnprotectedCount` is a counterfactual (score below DemotionThreshold) — not production demotion behavior.

Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
Typed-engine-protected findings are never demoted in production — a low median signals engine output quality, not a gate bug.

| Engine | Findings | Min | Median | Max | Would demote if unprotected |
| --- | --- | --- | --- | --- | --- |
| topology-coverage | 32 | 60 | 60 | 100 | 0 |
| compliance | 6 | 100 | 100 | 100 | 0 |
| cost-constraint | 10 | 100 | 100 | 100 | 0 |
| requirement | 11 | 100 | 100 | 100 | 0 |
| security-baseline | 10 | 100 | 100 | 100 | 0 |
| security-coverage | 6 | 100 | 100 | 100 | 0 |
