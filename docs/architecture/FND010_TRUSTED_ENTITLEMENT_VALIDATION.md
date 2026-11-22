# FND-010 trusted entitlement validation — fail-closed migration

This increment removes reliance on caller-provided `archlucid.resource_entitlement` claims. `EvidenceReadAuthorizationGate` now consults an explicit `IEvidenceEntitlementAuthority` server-side service for each exact tenant/workspace/project/run read. The default registered implementation always denies. This prevents unverified or self-asserted resource claims from granting access and ensures the SecureNow feature remains unusable until a trusted ACL-backed authority is deployed.

The interface is a production integration seam, **not an implemented entitlement issuer**. A future implementation must bind the authenticated principal to a trusted identity, enforce current ACLs, support immediate revocation and expiry, validate resolved-run ownership, audit decisions and use tenant-scoped persistence. No live identity provider or ACL backend has been connected. No real HTTP host-level cross-tenant tests have been added. Existing controller test fixtures use explicit mocked server-side decisions.

Do not enable the SecureNow exchange until these remaining tasks and CI/security checks are completed. The change deliberately prioritizes fail-closed safety over premature feature activation.
