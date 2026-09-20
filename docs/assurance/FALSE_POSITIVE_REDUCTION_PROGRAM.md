> **Scope:** Contributor-reference — internal engineering assurance guidance and operational controls; not buyer-facing proof or a correctness/superiority claim.

# False-positive reduction program

False positives are not reduced by suppressing uncomfortable findings. They are reduced by producing **counterexamples that should stay clean**.

## Program

For every engine or reasoning family:

1. identify the strongest positive case;
2. create the nearest legitimate negative/counterexample;
3. create an ambiguous case that should become InsufficientEvidence rather than positive/negative certainty;
4. preserve the pair in the semantic corpus;
5. measure false positives separately by dimension/severity.

## Priority negatives

- private endpoint with no public route;
- scoped Reader versus write-capable privilege;
- redundant dependency with genuinely independent failure domains;
- missing documentation that is not a confirmed architecture defect;
- cloud-neutral requirement with multiple acceptable cloud-specific designs;
- risk-accepted governance state that must not become “control passed”;
- inferred data flow that must not become observed movement.

## Repair order

When a false positive appears:

1. correct evidence/provenance boundary;
2. narrow deterministic predicate;
3. add missing negative-world/counterexample;
4. adjust semantic prompt/model only after deterministic causes are excluded.

Architecture Intelligence's existing false-positive budgets remain the quantitative gate; this program supplies the case-design discipline behind them.
