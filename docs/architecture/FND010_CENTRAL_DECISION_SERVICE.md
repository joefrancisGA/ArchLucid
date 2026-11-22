# FND-010 centralized authorization decision service

`ICentralAuthorizationDecisions` is the new shared decision contract. The first implemented action is `evidence.read`; unknown actions are denied, not silently mapped to a broader policy. Decisions validate authenticated principal, exact trusted tenant/workspace/project scope, authoritative SCIM/project/run entitlement, and existing ReadAuthority policy. Exceptions fail closed. The existing evidence gate delegates to the service, so SecureNow's anchor and resolved-run checks follow the same policy path.

This is a **first vertical slice**, not a universal authorization engine: background-worker identity, remediation actions, durable audit decision IDs, policy versioning, and resource-specific action handlers are future integrations. No positive authorization caching is introduced. No production feature flag is enabled. Test and CI confirmation are required before merge.
