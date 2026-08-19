# Adversarial golden-cohort traps (Prompt 14)

Deterministic analyzers only — no live LLM. Scores live in `scores/adversarial-deterministic-scores.json` (test-generated).

| Fixture | Trap |
| --- | --- |
| `compensating-control-trap` | Anti-pattern surface with compensating control narrative |
| `evidence-contradicts-narrative` | Relationship claims contradict inventoried graph |
| `synthetic-datastore-alias-trap` | Plausible wrong `ds-{label}` alias |
| `missing-evidence-trap` | Endpoints missing — gate must reject, not pass silently |
| `risk-accepted-not-pass` | Risk-accepted disposition must not read as pass |
| `hub-spoke-mislabel` | Hub-and-spoke vs mesh mislabel |
