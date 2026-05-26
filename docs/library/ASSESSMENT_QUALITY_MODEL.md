> **Scope:** Evaluator — canonical weighted quality model for clean-slate ArchLucid readiness assessments; not a buyer-facing status report.

# Assessment quality model

Use this model when producing first-principles weighted readiness assessments unless the user supplies an explicit replacement model in the prompt.

## Scoring formula

- Score each quality from **1** to **100**.
- Use the weights below exactly.
- Weighted readiness contribution = `score * weight / total weight`.
- Weighted deficiency signal = `(100 - score) * weight`.
- Overall `(A)` headline readiness = `sum(score * weight) / sum(weight)`.
- Rank urgent qualities by **weighted deficiency signal**, not raw score alone.

The total weight is **45**.

## Qualities

| Quality | Weight | Definition |
| --- | ---: | --- |
| Cutting-Edge AI Technology | 8 | Modernity and technical strength of the AI substrate: model integration, retrieval design, structured outputs, context-window handling, redaction, evaluation hooks, and the degree to which the solution uses current AI techniques without compromising enterprise constraints. |
| AI/Agent Readiness | 8 | Operational readiness of the agent system: deterministic orchestration, real/simulator separation, schema enforcement, quality gates, budget controls, fallback behavior, and observability around agent output quality. |
| Time-to-Value | 7 | How quickly a pilot or evaluator can reach the first credible review outcome, committed manifest, artifact, explanation, and sponsor-usable evidence. |
| Adoption Friction | 6 | The practical effort required for a customer to configure identity, ingest evidence, run the pilot path, validate security posture, and integrate the product into existing operations. |
| Proof-of-ROI Readiness | 5 | Strength of the financial value narrative: cost evidence, savings estimates, pricing-basis labels, discounts, confidence boundaries, pilot deltas, and executive-facing ROI proof. |
| Executive Value Visibility | 4 | Ability for sponsors and decision-makers to understand outcomes through dashboards, reports, exports, trend views, graph explanations, and clear action narratives. |
| Maintainability | 4 | Long-term engineering clarity: modularity, contract discipline, DDL discipline, configuration catalogs, architecture invariants, testability of changes, and resistance to documentation or code drift. |
| Reliability | 2 | Runtime resilience against expected failures: idempotency, retries, health checks, outbox/DLQ behavior, data consistency probes, budget cutoffs, cache behavior, and safe degraded paths. |
| Supportability | 1 | Ease of operating and diagnosing the product: logs, traces, metrics, dashboards, admin diagnostics, support bundles, runbooks, and procurement-pack evidence generation. |

## Scope boundary

Apply `Assessment-Scope-V1_1.mdc` before scoring. Items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism must be discussed honestly but not deducted from the `(A)` headline readiness score.
