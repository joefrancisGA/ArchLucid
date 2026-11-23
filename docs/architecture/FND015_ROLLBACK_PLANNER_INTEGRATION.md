# FND-015 rollout and rollback integration

This additive reference planner consumes a successful FND-014 in-memory dry-run result and an independent planning authorization decision. It produces a schema-shaped FND-015 `planned` document with pending preflight checks, post-deployment verification checkpoint, manual rollback strategy, and source/simulated digests and decision references. It also calculates inverse property steps in reverse order for review only.

**It never executes rollback or deployment.** Inverse steps are not guaranteed safe on a live system; their preconditions must be independently revalidated against the current resource state and any dependent resources. The FND-015 schema is a shape contract, not an execution authorization or guarantee of recoverability.

The consolidated CI workflow runs FND-005 evidence tests, FND-010 authorization tests, FND-014 simulation tests and FND-015 rollback tests. Passing CI is not yet established.

## Remaining release gates
- Validate generated documents against the FND-015 JSON Schema using the official repository validator.
- Implement durable, signed audit trails, production policy checks, shared replay storage and true OS/container isolation.
- Verify actual resource dependency order, rollback feasibility, concurrency conflicts, and independent post-remediation verification.
- Complete and merge prerequisite PRs in dependency order after security/CI approval. No production remediation is enabled.

## Control reuse audit — 2026-11-23

The FND-015 planner remains a **non-executing reference**: it accepts a
caller-supplied `RollbackPlanningDecision`, a FND-014 simulated result, and
evidence references. The model does not independently validate identities,
attestation, signatures, tenant provenance, or live resource versions. Indexed
`master` searches for `plan_rollout_and_rollback` show the reference, test
invocations, and FND-016 isolated recovery rehearsal tests; no production
C# or Python worker integration was demonstrated.

The focused reuse correction applies the same strict proof interpretation
already adopted by FND-014/016/018: `decision.allowed` must be literal
Boolean `True`, not a truthy number or string. It additionally checks each
FND-014 `changes` entry before creating the inverse. Every change must have
four fields, nonempty string resource/key identities, string-or-null property
values, and an actual value change. Repeated changes to the same property
must form a contiguous forward-state chain: the following old value must
equal the preceding new value. The inverse still reverses the valid
chronological changes, preserving dependent same-property transitions.

A rejected plan emits no document or inverse steps; a successful one still
remains `planned` with pending preflight and **manual** rollback. This
hardening is not a claim of validated recovery or a new execution authority.
The existing FND-016 independent rehearsal and evidence-bound signature
checks remain distinct.

Validation for this correction is the focused FND-015 test suite, schema
integration test, and consolidated FND-005/010/014/015 PR workflow. New PR
checks must pass before merge. No comprehensive `master` build is authorized.
