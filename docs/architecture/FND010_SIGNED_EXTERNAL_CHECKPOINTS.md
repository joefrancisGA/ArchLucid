# FND-010 independently signed checkpoints — first implementation

An Ed25519 checkpoint signs a canonical UTF-8 JSON payload containing the authorization hash-chain sequence, latest SHA-256 hash, key identifier, timestamp and domain separator. The private key is not stored in SQL. The verifier checks the signature against a separately supplied public key, optionally compares the live SQL head, and rejects rollback/fork relative to an independently trusted minimum sequence/hash.

The disposable GitHub Actions integration workflow generates a one-run signing key, signs the SQL chain head, verifies it, and uploads the checkpoint and test public key as a 30-day Actions artifact **outside the SQL Server container**. Eight negative/positive tests cover tampering, wrong keys, head mismatch, rollback, fork and genesis.

## Production security requirements — NOT YET IMPLEMENTED
1. Provision an organization-controlled signing identity in Azure Key Vault Managed HSM (or equivalent). Signing must be performed by a separate trust domain with strict access control and no exportable production private key.
2. Pin trusted public keys or certificates outside the checkpoint artifact, with explicit key IDs, rotation, revocation and expiry. **A public key shipped alongside its signature is not independently trusted**; the CI artifact is demonstration-only.
3. Retain signed checkpoints in immutable/WORM storage outside the database and enforce an independent monotonic latest-sequence anchor. GitHub Actions artifacts with 30-day retention are not compliance-grade immutable storage.
4. Verify complete chain history from an externally trusted checkpoint, not merely the current SQL head. A signed checkpoint authenticates a particular state; it does not by itself prove every intermediate record is intact.
5. Restrict SQL writer to stored-procedure EXECUTE and remove direct journal/chain DML grants. Apply migration 355 first.
6. Define schedule, alerts, disaster recovery, and incident response for missed checkpoints or integrity mismatches.

No production key material or production database was accessed. No production feature flags or remediation execution were enabled.
