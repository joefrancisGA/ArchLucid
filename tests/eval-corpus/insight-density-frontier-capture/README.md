# Insight-density frontier capture fixtures

Committed capture records for `InsightDensityFrontierCaptureEvaluator` and `scripts/capture_insight_density_frontier.py`.

These are **not** captured frontier-model transcripts and do **not** claim ArchLucid beats any named model. The committed **`synthetic`** fixture is a labeled regression instrument only. **`pilot-pending`** captures may be added by operators after live runs but are not required in CI.

| Fixture | Label | Baseline source | CI role |
| --- | --- | --- | --- |
| `synthetic-highly-novel.json` | synthetic | human-authored | Regression — must match `expectedNoveltyPercentage` |
| `pilot-pending-idle.json` | pilot-pending | empty | Idle placeholder until G-REAL-06 pilots land |

Schema: `docs/quality/fixtures/insight-density-frontier-capture.schema.json`
