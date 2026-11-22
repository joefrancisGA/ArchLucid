# ADR FND-015 — Rollout and rollback contract

Status: Proposed schema-only 2.0 foundation. No runtime integration or customer environment mutation.

## Existing source mapping
IE-13 `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` defines preflight, approval, advisory execution and later-snapshot verification. `docs/runbooks/MIGRATION_ROLLBACK.md` documents restore-first DBA-controlled migration recovery.

## Decision
Introduce a versioned exchange contract under `schemas/operations/rollout-rollback/` with positive and negative fixtures. Keep it isolated from the existing 1.0 execution, approval and deployment paths.

## Trust and safety
A planned rollout is not approved or executed. A valid JSON rollback strategy is not proof it is safe or tested. Future implementation must validate tenant authorization, frozen pattern, independent approval, checkpoint health, audit records, and rollback evidence. `not-defined` must block execution. Never bypass existing 1.0 deployment controls.

## Integration gates
Add a real adapter only after mapping execution boundaries, verifying tenant/actor context, negative authorization and side-effect tests, and independent security review. Preserve existing CI and release protections.
