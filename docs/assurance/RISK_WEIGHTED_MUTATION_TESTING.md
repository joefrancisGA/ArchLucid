> **Scope:** Contributor-reference — internal engineering assurance guidance and test-program evidence; not buyer-facing proof or a correctness/superiority claim.

# Risk-weighted mutation testing

Mutation testing should be concentrated where a surviving semantic defect could invalidate trust, not raised globally until every low-value helper has an arbitrary score.

## Critical truth kernels

Target **90–95%+ mutation score** for small, stable kernels when practical:

- tenant/scope isolation predicates;
- authorization and role/scope resolution;
- sealed evidence/hash/immutability logic;
- evidence/provenance classification;
- SecureNow reachability and privilege propagation;
- path ranking and cut-point logic;
- cross-run drift/diff truth;
- decision-grade vs checklist classification;
- commit-blocking failure classification;
- claim/evidence honesty guards.

The repo-wide Stryker baseline may remain lower while these kernels are ratcheted separately.

## Survivor policy

For each meaningful survivor:

1. identify the behavioral distinction the mutant exposes;
2. decide whether the mutant is equivalent/meaningless;
3. if meaningful, add the smallest semantic/property/metamorphic test that kills it;
4. prefer a structural invariant when the defect class can be made impossible;
5. record intentionally equivalent survivors rather than gaming the score.

Do not add brittle line-by-line tests solely to increase the percentage.

## CI posture

Broad mutation can remain scheduled/ratcheted. Critical-kernel mutation is eligible for stronger PR enforcement because the test surface is deliberately small and the failure cost is high.
