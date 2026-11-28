> **Scope:** Planner implementation and focused CI evidence for a pinned, tenant-scoped remediation graph. This is an advisory result, not authorization to execute changes or an estimate of realized risk reduction.

# FND-091 advisory remediation portfolio alternatives

## Contract

The planner maximizes weighted, distinct modeled coverage (points) while minimizing estimated cost (minor units in the request currency) and estimated disruption (minutes). It keeps feasible alternatives that trade off these objectives. It does not reduce them to a weighted sum. Hard controls still apply, including mandatory actions and their prerequisites, conflicts, the budget, disruption limits, and per-team staffing capacity. Estimates must qualify under the existing optimizer policy. Portfolio alternatives expose which resource limits they reach and use the existing advisory feasibility and coverage evidence.

Results are tied to the normalized, scoped input digest and solver version. Alternatives sort by coverage descending, cost ascending, then disruption ascending. When portfolios share all objective values, fewer actions win, followed by ordinal action IDs. Returned alternatives are immutable. No service registration, workflow execution, cloud writes, or external solver dependency is introduced.

## Bounds and interpretation

The planner traverses the same pinned decision model as the existing single-objective optimizer. It prunes only when an already feasible alternative strictly dominates the branch's optimistic coverage and resource bounds. Equality is kept for the deterministic representative rule. A completed result describes the exact frontier of the selectable modeled actions, not of unmodeled or excluded actions.

The caller may request up to 32 alternatives. The search tracks at most 256 distinct nondominated objective vectors at a time. Display truncation on a completed result leaves its exact retained count intact. A work, time, cancellation, or frontier limit makes the result explicitly incomplete, even if the display cap is not reached. Any returned alternatives are feasible and nondominated among the evaluated candidates, but may be dominated by unvisited candidates. Invalid, stale, or mismatched evidence does not produce a portfolio.

## Evidence

- The separate test oracle exhaustively enumerates masks from test data, checks feasibility and joint coverage clauses, then compares every pair of feasible objective vectors. It compares the exact planner frontier on 96 deterministic seven-action cases.
- Focused cases cover unsupported weighted-sum compromises, multiple binding limits, scope rejection, deterministic ties, uncertainty, and the differences between time, work, cancellation, frontier, and display limits.
- Synthetic fixtures with 8, 32, and 96 actions compare the new planner with the existing optimizer, top-N, and feasibility-aware greedy selection. The test records objective scores, search work, elapsed time, and allocation. These are diagnostic comparisons, not deployment performance claims.
- The remediation-portfolio PR check requires both the original optimizer and Pareto suites to execute and pass.

See [FND-089 optimizer assurance](FND089_REMEDIATION_PORTFOLIO_OPTIMIZER.md) for the shared graph, scope, estimate, and resource contract. Recommendation presentation and sensitivity analysis remain separate follow-up work.
