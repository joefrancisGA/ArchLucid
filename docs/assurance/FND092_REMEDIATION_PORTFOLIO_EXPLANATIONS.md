> **Scope:** Versioned SecureNow advisory portfolio explanation and offline what-if comparison. This does not authorize actions, prove real-world effectiveness, activate a production surface, or change IE-15 ranking.

# FND-092 explainable portfolio recommendations

`RemediationPortfolioExplanationService.Build` accepts the authorized current graph pin, the original FND-091 planning inputs, caller-designated critical scenarios, and a list of already approved sensitivity assumptions. The service does not make or verify a policy approval decision. Approval-basis IDs identify the caller's decision. A typed result records the tenant/project/snapshot pin, graph and inventory fingerprints, policy, engine, risk model, objective, constraint, ranking and solver versions, and a normalized explanation input fingerprint. Empty, invalid, stale or mismatched inputs cannot produce a plan. Use the original authorized boundary before calling or distributing a report.

## Explain the proposed portfolio

- The first feasible proposal and up to seven other retained FND-091 alternatives each report a distinct scenario score breakdown, coverage evidence and modeled causes. Reviewed but uncovered scenarios are different from unknown ones. Caller-designated critical cases remain visible in either state. Binding limits and resource usage come from the same canonical model used by the planner.
- Each selected action shows captured finding links and rank, estimate basis and estimate kinds, evidence references, transitive prerequisites, and whether it belongs to the mandatory closure. Its marginal effect subtracts the score after removing it **and** the selected dependents that require it. Removing a mandatory bundle is only a diagnostic. Marginal effects can overlap and must not be added.
- Excluded actions retain their captured finding links and rank. The reasons describe adding the action with its prerequisites to the particular displayed portfolio. They distinguish evidence/eligibility, unknown estimates, conflicts and resource limits. An addable action may add no points or may simply not have been selected. These are not proofs about substitutions or the outcome of a bounded search.
- Search status, fingerprints, evaluated nodes, retained counts and display truncation remain visible. A limited search can return a valid option without establishing an exact frontier or the best possible portfolio. FND-090 independent proposed-state verification is a separate activity and is not run or implied by this report.

## Compare approved what-ifs

Only cost ceilings and scenario weights may vary. A change to weights must carry a distinct version of the hypothetical objective. The rest of the input is pinned, including policy, data, estimates, mandatory actions, prerequisite/conflict graph, disruption, staffing, currency and ranking. Each case records its assumptions and search outcome. Compare selected actions, distinct covered scenarios, money, staffing, disruption and binding limits. Variant scores are reported on their own scale. Changes in points are always calculated on the original weight scale. If either side lacks a feasible option, no delta is inferred.

The service limits a report to eight detailed alternatives and four approved cases. The sum of requested solver timeouts may not exceed 20 seconds; the existing per-search node, timeout and frontier caps still apply. A failed graph is not retried as a scenario. A relaxed budget may recover a feasible plan from an infeasible baseline, but it cannot remove mandatory actions or create a baseline delta. Cancellation stops further comparisons and preserves already completed report sections.

## Read-only proposed-plan view

Pass an already authorized result to `PortfolioExplanationView.RenderHtml` to render it alongside the sensitivity cases as a standalone HTML document. The view is script-free and escapes all report values. It contains no forms, external resources, execution controls or LLM-derived facts. Authorized callers own distribution of the scoped report. There is no new HTTP endpoint, production registration, or change to the IE-15 ranking or approval workflow.

## Verification

The focused remediation-portfolio workflow runs and requires successful execution of FND-089, FND-091 and FND-092 suites. `RemediationPortfolioExplanationTests` independently checks a worked example with alternatives that share coverage, one joint clause and a mandatory dependency. With 7 units of budget, the first option covers 12 points. With 12 units it covers 16. Increasing the weight of the other scenario selects a 25-point option on the new scale that is worth 9 points on the original scale. These values follow the graph and resource arithmetic in the test fixture, not the implementation. The example is tied to the [pinned portfolio proposal](https://github.com/joefrancisGA/ArchLucid/blob/761d555473d0540df05bec668501b27e2f0707e4/docs/architecture/REMEDIATION_PORTFOLIO_OPTIMIZATION.md#6-explainability-and-customer-experience). Negative controls cover scope rejection, unavailable evidence, unapproved or invalid assumptions, truncation, infeasible variants and unsafe HTML-like text.

See [FND-091](FND091_REMEDIATION_PORTFOLIO_PARETO.md) for the optimizer's modeled coverage and frontier semantics.
