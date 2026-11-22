# FND-015 rollout and rollback integration

This additive reference planner consumes a successful FND-014 in-memory dry-run result and an independent planning authorization decision. It produces a schema-shaped FND-015 `planned` document with pending preflight checks, post-deployment verification checkpoint, manual rollback strategy, and source/simulated digests and decision references. It also calculates inverse property steps in reverse order for review only.

**It never executes rollback or deployment.** Inverse steps are not guaranteed safe on a live system; their preconditions must be independently revalidated against the current resource state and any dependent resources. The FND-015 schema is a shape contract, not an execution authorization or guarantee of recoverability.

The consolidated CI workflow runs FND-005 evidence tests, FND-010 authorization tests, FND-014 simulation tests and FND-015 rollback tests. Passing CI is not yet established.

## Remaining release gates
- Validate generated documents against the FND-015 JSON Schema using the official repository validator.
- Implement durable, signed audit trails, production policy checks, shared replay storage and true OS/container isolation.
- Verify actual resource dependency order, rollback feasibility, concurrency conflicts, and independent post-remediation verification.
- Complete and merge prerequisite PRs in dependency order after security/CI approval. No production remediation is enabled.
