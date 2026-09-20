# Superhuman assurance program — wave A

This wave executes prompts **5–16** from the 40-prompt assurance program, rebased against current repository truth.

## Implemented here

- **5 ArchLucid Metamorphic Test Suite** — representative golden cases are invariant to graph collection order and JSON round trip.
- **6 Credibility Defect Taxonomy** — dedicated P0/P1/P2 trust-destroying defect classes.
- **7 CredibilityTripwireTests** — cross-engine identity/evidence/failure visibility invariants over the full decisioning golden corpus.
- **8 Three-State Evaluation Contract** — formalizes existing `FindingsSnapshot.EngineFailures` + generation-status behavior rather than adding a redundant state system.
- **9 Assurance Envelope** — maps input, engine/rule, evidence, provenance, scope, uncertainty and model provenance.
- **10 Independent Reference Path Engine** — brute-force reachability oracle compared with SecureNow production reachability on a small graph.
- **11 Reference RBAC Resolver** — independent Azure scope-ancestry oracle for subscription/RG/resource scope truth.
- **12 Reference Cut-Point Verification** — brute-force path-collapse counts cross-checked against production cut-point output.
- **13 Risk-Weighted Mutation Testing** — critical-kernel ratchet policy.
- **14 Mutation Survivor Investigator** — included in the risk-weighted mutation survivor protocol.
- **15 Corpus Blind-Spot Review** — independent-truth adversarial dimensions for ArchLucid.
- **16 SecureNow Corpus Blind-Spot Review** — inheritance/directionality/evidence/public-private adversarial dimensions.

## Important limitation

Prompt 11 now supplies the **independent RBAC oracle**, but broad randomized production-vs-reference inheritance comparison still depends on a single canonical production effective-scope resolver. The current SecureNow path plane consumes materialized RBAC relationships; it does not expose one small public resolver with the same shape as the test oracle. That difference is intentionally documented rather than hidden.

A later truth-kernel consolidation may make the production comparator smaller without moving the reference algorithm into production.
