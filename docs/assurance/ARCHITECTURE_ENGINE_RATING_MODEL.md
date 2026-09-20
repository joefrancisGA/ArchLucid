> **Scope:** Contributor-reference — internal engineering assurance guidance and benchmark methodology; not buyer-facing proof or a superiority claim.

# Architecture engine rating model

A chess-style mental model is useful only if it does not erase the dimensions that matter.

## Product-of-record dimensions

| Dimension | Interpretation |
|---|---|
| Recall | Important architecture issues found |
| Precision | Findings that are legitimate rather than false alarms |
| Severity calibration | Importance assigned appropriately |
| Evidence quality | Conclusions trace to sufficient supplied evidence |
| Tradeoff recognition | Conflicting quality attributes/objectives are exposed |
| Recommendation usefulness | Actionable, feasible and preserves requirements |
| Unsupported-claim control | Avoids conclusions stronger than evidence |
| Contradiction control | Avoids mutually incompatible findings/artifacts |
| Consistency | Same semantics across runs/surfaces |
| Time | Wall-clock or reviewer time |
| Cost | Model/tool spend |

## No universal Elo

Do not collapse these dimensions into one public “architecture Elo.” A system with excellent recall and invented evidence is not made trustworthy by averaging those numbers.

For research visualization, a composite may be computed externally with an explicitly versioned weighting scheme, but the raw dimensions and hard gates must accompany it and no single winner may be inferred by the repository tooling.

## Comparisons

Version-to-version reports show per-dimension deltas, hard-gate changes, time and cost. Human comparisons use blinded case-level grades. Comparisons should state case population and date because a benchmark tuned during development is not equivalent to a sealed holdout.
