# ADR FND-010 — Authorization policy interface and decision envelope

Status: Proposed schema-only 2.0 foundation (2026-11-22), not an authorization provider.

## Existing source mapping
- `ArchLucid.Core/Authorization/ArchLucidPolicies.cs` defines ASP.NET Core policy names such as `ReadAuthority`, `ExecuteAuthority`, `AdminAuthority`, and cross-tenant platform authorities.
- `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` (IE-13) requires approved pattern versions, exceptions, conflict-free matching and preflight. Execution is advisory-only.
- `docs/library/AUDIT_EVENT_MODEL.md` defines authoritative actor and tenant/workspace/project audit context.
- `docs/library/REMEDIATION_PATTERN_MATCHING.md` (IE-11) prevents AI from declaring an ExactMatch.

## Decision
Introduce a versioned, strictly bounded **decision envelope** for future 2.0 policy integration. It records authenticated actor and resource references, tenant scope, requested action, allow/deny decision, approval class, policy version reference, evaluation time and reasons. An allowed remediation approval/execution decision must reference at least one approval and an appropriate approval class. This does not confer authorization or add execution functionality.

## Critical trust boundaries
- **The schema is not a policy decision point or enforcement point.** An attacker can submit a syntactically valid `allow` record. Never authorize from caller-supplied JSON.
- A future trusted PDP must authenticate actor, tenant and resource and evaluate current RBAC/ABAC claims against server-side policy. Enforce default deny on missing, stale or failed policy evaluation.
- Cross-tenant authority is distinct from tenant admin; no implicit privilege escalation or wildcard tenant grants.
- Approval references must be independently verified for signature/identity, scope, expiration, revocation, separation of duties and replay protection. A nonempty array is not proof.
- Approval class is metadata, not evidence of dual control. Future PDP must enforce distinct human actors where required.
- Recheck authority immediately before any state transition or queued execution; fail closed on revoked approval.
- Existing 1.0 ASP.NET Core authorization and IE-13 preflight remain authoritative.
- Never enable direct customer Azure mutation as part of this foundation.

## Follow-up
Implement an interface adapter only after mapping current authorization handlers and policies, add negative tenant/role/approval tests, connect to FND-009 durable audit correlation and review production enforcement points. No 1.0 runtime behavior changes.
