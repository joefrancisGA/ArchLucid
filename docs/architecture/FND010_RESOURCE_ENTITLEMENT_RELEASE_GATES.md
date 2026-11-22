# FND-010 resource entitlement enforcement

The SecureNow exchange now requires an exact authenticated principal claim:
`archlucid.resource_entitlement=evidence.read:{tenantGuid}:{workspaceGuid}:{projectGuid}:{runGuid}`.
Both the anchor run and resolved historical run are independently checked. A broad ReadAuthority grant alone is insufficient. No wildcard is accepted. The gate fails closed before repository reads if the entitlement is missing.

**Critical trust assumption:** claims must be minted and cryptographically validated by a trusted identity/authorization service after actual resource ACL checks. This change does NOT implement claim issuance, entitlement revocation, ACL storage, or authorization audit. If arbitrary callers can supply this claim or if it is never issued, the endpoint is respectively insecure or unavailable. The SecureNow exchange must remain feature-disabled until issuer trust, expiration/revocation and full HTTP authentication tests are verified.

Focused tests cover missing entitlement and no repository access, while existing test principals now carry exact test entitlements. Full real-host HTTP cross-tenant tests and CI remain required.
