> **Scope:** Generated insight-density engine distribution rollup for golden-corpus measurement; advisory-only — not production demotion behavior or buyer certification evidence.

# Insight-density engine distribution

claimBoundary: Advisory-only measurement — scores do **not** demote typed-engine findings in production.
DeterministicInsightDensityGate returns Promote / DecisionGradeFinding for non-agent findings
(penalty reason `typed-engine-protected`); the computed score is visible here but is not a control.
This corpus exercises **six** engine types in this table (≥1 finding across case-01..case-34). The golden corpus harness registers **14** engines; **33** built-in product engines are absent from this corpus-derived slice.
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
