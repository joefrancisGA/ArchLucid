> **Scope:** FND-089 bounded advisory portfolio planning on a pinned FND-088 graph; not a production rollout gate or a claim of real-world remediation effectiveness.

# FND-089 remediation portfolio optimizer

The SecureNow slice accepts an already authorized project/snapshot graph and a separately supplied current binding and graph digest. It requires the same pin on the request and the captured top-N ranking. The caller is responsible for authorizing that context and supplying approved inputs. The module does not read or write a repository, run the ranking service, create a remediation wave, or execute actions. Future ArchLucid adapters can use the same solver-neutral request and result contract.

Use a pinned constraint policy and objective version. Supply nonnegative integer currency minor units, staffing minutes per approved team or skill pool, additive disruption service-minutes, and scenario coverage points. Staffing is a complete vector, with omitted members of the approved pool list representing explicitly zero use. Estimate source kind and basis are retained in the input digest. An optional action with missing estimates, or one that depends on it, is excluded with an issue. A mandatory action with missing evidence or estimates stops planning. Conflicting or over-budget mandatory closures are proven infeasible under this contract. This slice models aggregate limits, not time-indexed assignment, scheduling or non-additive disruption.

Each reviewed scenario counts once, regardless of how many sufficient clauses are satisfied. A clause counts only if all its actions and their prerequisite closure are selected. Unverified scenarios remain unknown, and reported coverage includes zero-weight scenarios actually covered. Weighted points are a modeled coverage proxy, not a probability, expected monetary loss, or observed result.

The SecureNow adapter maps a previously captured ranking's finding IDs to graph actions. It uses each distinct action's best linked rank, considers at most the requested top N eligible ranked actions and checks each prerequisite bundle against the same hard limits. It does not refill slots with lower-ranked actions. This is a read-only projection of current top-N intent, not a reenactment of existing wave creation. The greedy comparator considers complete useful bundles by nonnegative marginal coverage, including joint clauses, and does not claim an approximation ratio. The search independently explores feasible inclusion/exclusion branches, using remaining weighted coverage as an admissible upper bound. It breaks equal-score ties by fewest actions and then ordinal IDs. It avoids exploring optional actions that cannot contribute to a positive-weight clause or such a clause's prerequisites. This pruning is valid for nonnegative additive constraints and the specified tie policy.

Input caps, independent node/evaluation caps and a shared injected-clock deadline bound the run. A stopped run can return a validated incumbent with a conservative bound and gap, never an optimality claim. Bounds and optimality apply only to the evidence- and estimate-eligible candidate set. All returned plans are checked against FND-088's canonical selection assessment as well as resource limits. The scoped test lane compares the solver against a separate exhaustive fixture evaluator and checks actual execution counts.

## Solver evaluation and next slices

| Approach | FND-089 disposition |
| --- | --- |
| Bounded branch-and-bound | Implemented with exact integer arithmetic, independent exhaustive checks on small fixtures and no additional dependency. Worst-case search remains exponential. |
| Mixed-integer programming | The action and clause model is linearizable and could supply tighter bounds at scale. Not selected for the first slice without representative performance, deployment, licensing and determinism evidence. |
| Constraint programming | Candidate when maintenance windows, scheduling or richer constraints are justified. Not needed for this aggregate-limit slice. |

Counterfactual recomputation, Pareto alternatives, and richer explanations remain FND-090 through FND-092. Estate-scale comparison, later fresh-evidence effectiveness measurement, calibration and rollout gates remain FND-093. No external solver performance or production outcome is claimed.
