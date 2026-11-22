# FND-010 centralized evidence authorization boundary

## Reference implementation
`scripts/integration/fnd010_evidence_authorization.py` introduces an explicit gate between an authenticated principal and evidence retrieval. The trusted decision service must authorize the exact `principal_id`, `action=evidence.read`, tenant and evidence ID. No repository call is made for denied, malformed, mismatched or unavailable decisions. A second tenant-scoped repository query is required to prevent authorization bypass via a stale or confused-deputy decision. The signed evidence envelope must bind the evidence ID and trusted tenant/lineage, and verification follows retrieval.

## Trust assumptions and limitations
This is additive, inert Python reference code. The decision service and scoped repository are **interfaces only**. The reference does not authenticate users, issue tokens, implement policy/roles, enforce authorization in .NET API middleware, or connect to storage. A production decision must also bind workspace, project, run, snapshot, expiry, resource version and policy version; the current decision object binds tenant and evidence ID while the repository independently enforces full scope. An attacker-controlled implementation of either dependency defeats the model.

The interface deliberately returns no evidence bytes and uses generic denial reasons to limit existence disclosure. Real deployments need structured audit logs without leaking content, transactionally consistent scope checks, idempotent replay reservations, distributed key management, rate limits, and full HTTP negative tests.

## Deployment gates
1. Implement and verify real policy evaluation and scoped SQL predicates before wiring this into a live endpoint.
2. Require a real authenticated principal; never accept tenant or principal IDs from arbitrary client-supplied headers in production.
3. Verify policy changes and revoked access are reflected immediately and do not rely on cached allow decisions.
4. Obtain passing CI/security checks, and merge stacked FND-005 prerequisites first.
