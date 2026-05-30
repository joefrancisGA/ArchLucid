# Hot-path performance budgets (assessment #18)

Operator-facing paths with local/CI-friendly budget checks. Cloud-dependent load tests remain opt-in (`k6-*` workflows).

| Path | p95 budget (ms) | Fixture / check | Metric / dashboard |
|------|-----------------|-----------------|-------------------|
| Run detail (`GET /v1/authority/runs/{id}`) | 800 | `ArchLucid.Api.Tests` contract + integration smoke | `archlucid.run.detail.duration` |
| Proof packet CLI (`pilot-proof-packet`) | 120000 | `ArchLucid.Cli.Tests` proof packet tests | N/A (CLI wall clock) |
| Retrieval grounding read | 500 | `RunRetrievalGroundingServiceTests` | `archlucid.retrieval.grounding.duration` |
| Graph interactive projection | 1500 | `ArchLucid.Api.Tests` graph contract tests | `archlucid.graph.interactive.duration` |
| PDF/DOCX export | 30000 | export integration tests (opt-in SQL) | `archlucid.export.duration` |

## Local check

```powershell
python scripts/ci/assert_hot_path_performance_budgets.py
```

The script validates registry completeness and documents missing automated timing gates — it does **not** block CI on flaky wall-clock timing.

## Scale notes

- **Security:** budgets are per-tenant scoped reads; IDOR tests must stay green before optimizing hot paths.
- **Reliability:** async authority pipeline absorbs spikes; monitor dead-letter depth via cost reporting outbox card.
- **Cost:** retrieval and LLM paths dominate spend — pair latency budgets with LLM cost command center.
- **Scalability:** graph and proof paths may need read replicas or caching at 10k+ runs/tenant; revisit p95 when SQL telemetry exceeds budgets.
