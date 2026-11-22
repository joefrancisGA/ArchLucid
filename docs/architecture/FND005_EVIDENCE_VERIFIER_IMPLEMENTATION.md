# FND-005 evidence verifier — first implementation increment

This is an additive, inert Python reference implementation. It does not alter production API behavior or unblock outstanding FND-011 PRs.

## Verification semantics
- SHA-256 checks exact payload bytes; a matching digest alone **does not authenticate the producer**.
- Tenant, workspace, project, run and snapshot identifiers must all match a trusted expected scope.
- A valid HMAC-SHA256 signature over a canonical claim (including the content digest and all scope/lineage identifiers), verified with a separately provisioned trusted 32+ byte key, yields `verified`.
- Valid byte digest/scope without authenticated producer yields `unverified`; mismatches yield `rejected`.
- The verifier does not grant authorization, retrieve data, execute remediation, or infer truth from matching hashes.

## Integration sequence
1. Finish existing FND-011 PR CI and OpenAPI reconciliation before wiring this into API routes.
2. Adapt canonical evidence references from FND-005 and resolve key identity/rotation and trust-store policy.
3. Implement authorization decision enforcement before evidence is read across tenant boundaries.
4. Only after these gates, build dry-run sandbox isolation and rollback execution with explicit approvals.

## Release gates
- Verify focused CI passes; tests were added, not locally executed.
- Review key management, replay protection, payload size bounds, canonicalization interoperability and signature algorithm agility.
- Keep FND-005 schema and FND-011 snapshot exchange versioned and backward compatible.
