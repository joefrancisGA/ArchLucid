> **Scope:** Contributor assurance for IE-15 remediation scoring and the offline FND-087 shadow evaluator. This does not change live ranking or approve an action.

# FND-087 risk-ranking mathematics

## Preserve the historical score

`IE15-priority-v1` remains the published IE-15 ranking rule. Its normalized factors, signs, total clamp, explanations, persisted rule version, and existing tenant weight path are unchanged. The evaluator adds a nonnegative remediation-risk term, even though the legacy sort key mixes urgency with execution factors. For example, at the default risk weight of 0.05, a defined rollback contributes 0.0125 and an observed lack of rollback contributes 0.0375. This raises the mixed v1 score by 0.025, but does not establish that the unresolved finding is more urgent.

The same v1 rule also uses defaults for missing risk inputs, including zero for missing exploitation metadata and the no-rollback value when the existing caller supplies false. These legacy defaults are not proof of absence. The v1 tests pin hand-calculated totals and breakdowns before any proposal for migration.

## Read the new advisory axes separately

Call `RemediationRiskScoreEvaluator.EvaluateAdvisory` for the independent `IE15-priority-v2-shadow` report. It accepts an already-authorized finding and its scoped metadata, verified compensating-control evidence, automation level, rollback evidence, and an optional reviewed weight profile. It reads and writes no repository and is not called by the live ranking service.

| Axis | Inputs and polarity |
| --- | --- |
| Urgency | Severity, exploitability, explicit known exploitation, internet exposure, identity impact, asset criticality, data sensitivity and blast radius contribute positively. Verified compensating controls subtract. |
| Execution risk | Less automation increases the complexity proxy. A defined rollback has ordinal value 0.25 and an explicitly absent rollback has value 0.75. Both contribute positively. Neither changes urgency. |

Inputs use unitless ordinal scales in `[0, 1]`, not probabilities, costs, durations or promises of feasibility. Each weighted contribution is the value times its nonnegative weight. The urgency denominator is the positive urgency weight total. The mitigation term is subtracted before the result is clamped to that total. Execution uses the sum of its two weights. Each axis is normalized separately. A zero denominator means unavailable, not zero risk.

Known values use the same scales as v1. Missing, unsupported or conflicting inputs retain their own evidence categories. An unresolved factor contributes its possible range rather than an invented point value. An unverified mitigating control is not credited as a definite reduction. If a positive-weight factor is unresolved, return bounds but withhold the point score even if clamping makes the bounds coincide. An explicit Boolean false is a recorded observation, not missing evidence. Callers must not convert missing pattern content into a verified absence of rollback.

Advisory weight overrides must name known factors and be unitless values in `[0, 1]`. Missing overrides retain documented defaults. The report captures its effective profile. Use the existing tenant-scoped weight reader for a reviewed profile, and do not infer evidence authority from the profile. Advisory validation does not rewrite historical settings or apply new rules to the v1 write path.

## Verification and migration boundary

The focused Release tests cover hand-derived v1 and shadow cases, rollback polarity, unknowns and conflicting metadata, ordinal monotonicity, weight sensitivity and normalization, zero-weight axes, and two independently scoped tenant profiles. Existing IE-15 rank and wave tests also run.

Before switching any live sort key or writing different scores, compare both models on the same pinned, independently reviewed cohort. Validate proposal ordering and unknown-evidence handling, review tenant profiles that do not meet the advisory contract, and choose a deliberate migration and rollback plan. Retain historical results and their original rule version. [Portfolio optimization design](../architecture/REMEDIATION_PORTFOLIO_OPTIMIZATION.md)
