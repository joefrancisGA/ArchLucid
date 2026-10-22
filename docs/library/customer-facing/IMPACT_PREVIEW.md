# Impact preview — scope

Impact preview is a deterministic, repeatable what-if analysis that re-evaluates your governance policies and recorded findings against a proposed change — the same checks that ran in the review, so results are policy-consistent, not a fresh opinion. It does not observe or test your production systems; treat results as review-time analysis, not runtime validation.

## When to use it

- Before implementing a proposed architecture change, compare expected finding, risk, cost, and governance posture deltas against a finalized review baseline.
- When deciding whether a policy pack change would introduce or clear material findings on evidence you already recorded.

## What it is not

- Not a load test, chaos test, or production canary.
- Not a guarantee that the proposed change is sound in a live estate.
- Not a substitute for your change-management or release validation process.

## Decision ownership

Simulation output informs review; accountable reviewers and governance owners retain disposition authority. Material recommendations should route through governance before implementation — impact preview does not auto-approve changes.

## Related

- Operator surface: **Impact preview** under Insights.
- Findings and policy packs supply the checks that the preview re-runs against the proposed change.
