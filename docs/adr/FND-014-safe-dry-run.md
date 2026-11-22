# ADR FND-014 — Safe dry-run execution abstraction

Status: Proposed schema-only 2.0 foundation. No runtime integration or customer environment mutation.

## Existing source mapping
IE-13 `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` already emits advisory artifacts without cloud writes. Agent simulator (`docs/runbooks/AGENT_EXECUTION_FAILURES.md`) is distinct from a side-effect-free remediation simulation.

## Decision
Introduce a versioned exchange contract under `schemas/operations/safe-dry-run/` with positive and negative fixtures. Keep it isolated from the existing 1.0 execution, approval and deployment paths.

## Trust and safety
The schema can label an artifact dry-run but cannot prevent writes. A future runtime sandbox must deny outbound mutation credentials, filesystem/network writes, subprocess execution and unintended API calls, and verify effects with instrumentation. A plan must never self-authorize.

## Integration gates
Add a real adapter only after mapping execution boundaries, verifying tenant/actor context, negative authorization and side-effect tests, and independent security review. Preserve existing CI and release protections.
