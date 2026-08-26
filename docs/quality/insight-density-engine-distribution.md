# Insight-density engine distribution

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

