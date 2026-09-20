# SecureNow truth kernel

SecureNow's deterministic truth kernel is intentionally small. Its purpose is to establish **facts and bounded graph consequences**, not to replace architectural judgment.

## Kernel boundary

Deterministic/kernel responsibilities:

- normalize Azure resource identifiers and scope identity;
- preserve tenant/snapshot identity;
- classify evidence provenance;
- materialize observed/derived security edges from pinned snapshot rows;
- resolve bounded RBAC scope ancestry;
- enumerate bounded directed reachability/privilege paths;
- compute canonical path hashes;
- aggregate cut-point path collapse;
- enforce confidence/provenance monotonicity (inference never becomes ObservedFact);
- preserve missing evidence as InsufficientEvidence/evaluation failure rather than favorable truth.

Judgment/explanation responsibilities outside the truth kernel:

- business consequence without explicit assertion;
- whether a technically reachable path is likely to be exploited;
- organizational priority;
- remediation tradeoffs beyond deterministic constraints;
- prose explanation;
- compliance conclusions.

## Existing canonical components

- Azure inventory snapshot + security edge materialization
- `SecurityEvidencePathGuard`
- privilege and intended-reachability enumerators
- `SecurityEvidencePathCanonicalHash`
- `SecurityEvidenceCutPointAnalyzer`
- ordinal confidence/provenance contracts
- synthetic Azure worlds and metamorphic suite

## Independent checks

The assurance program adds test-only brute-force reachability, RBAC-scope and cut-point oracles. These **must not be moved into production as shared helpers**, because their value is disagreement.

## Remaining consolidation

RBAC effective-scope behavior is still represented primarily through materialized relationships rather than one tiny canonical production resolver. The independent scope oracle therefore establishes expected Azure ancestry truth, but full randomized production-vs-reference comparison remains a future consolidation opportunity. This limitation is explicit.
