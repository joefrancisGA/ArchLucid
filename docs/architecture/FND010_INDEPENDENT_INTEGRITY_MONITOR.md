# FND-010 independent integrity monitoring

This increment adds `scripts/security/fnd010_integrity_monitor.py`, a **read-only verifier** intended to run under a separate monitoring identity. It validates a managed PS256 checkpoint using a separately pinned public key and exact allowlisted key ID, recomputes every SQL hash-chain link from stored payload bytes, detects missing/noncontiguous sequence numbers, compares chained payload fields with journal records, checks the signed historical anchor and rejects rollback. On any failure it exits 2 and writes a minimal critical JSON alert artifact (without credentials or raw audit data).

Contract tests cover valid history, broken links, gaps, anchor mismatch, rollback and invalid genesis. A dedicated CI workflow executes these tests.

## Required deployment integration (not provisioned)
- Run under an **independent** read-only SQL principal with access to the journal and chain, no database-owner privileges.
- Retrieve checkpoints and pinned keys from independently governed immutable storage; do not trust SQL-provided checkpoint material. Pin allowed key versions and rotate explicitly.
- Schedule the verifier in a separate security subscription/account, configure a monitored alert destination (SIEM/on-call), and retain alert artifacts independently. This PR **does not install a recurring production schedule or deliver notifications**.
- Before activation, inventory or backfill historical journal rows not covered by migration 355; the verifier intentionally flags unmatched journal rows.
- Run end-to-end tests against real SQL and immutable Blob with workload identities. SQL query mocks alone are not sufficient evidence of production readiness.
- Prevent direct DML bypass of the append procedure and enforce immutable storage policies. Verify recovery from backups and checkpoint key rotation.

No production secrets, cloud resources, or production scheduler were changed.
