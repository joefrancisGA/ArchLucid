# FND-010 atomic authorization audit hash chain (v1)

Migration 355 adds an append-only `AuthorizationDecisionChain` table and a stored procedure `AppendAuthorizationDecision`. The procedure serializes a fixed-field-order SQL Server JSON record to UTF-16LE bytes, hashes it with SHA-256, and computes `SHA256(0x01 || previousHash || SHA256(payload))`. The stored payload bytes are the canonical verification source. It atomically inserts both the original decision journal record and the hash-chain entry inside one transaction, protected by a transaction-owned exclusive SQL application lock. Failure rolls back both records, and the central authorization service fails closed.

The existing SQL writer now calls the stored procedure. The disposable SQL CI test verifies 12 concurrent appends, sequential link integrity, hash recomputation, and UPDATE/DELETE denial. Migration 354 must precede 355.

**Important release gates:**
- Restrict the runtime identity to EXECUTE on `dbo.AppendAuthorizationDecision`; revoke direct INSERT, UPDATE, DELETE and schema ownership on both tables. Otherwise legacy direct journal inserts can bypass the chain. Privileged administrators can still bypass SQL triggers.
- This chain is tamper-*evident* only relative to a trusted externally retained checkpoint. A privileged attacker could rewrite the entire database chain. Signed external checkpoints and independent retention are NOT implemented.
- Existing pre-migration journal records are not backfilled and are not included in this chain.
- Verify behavior against a real SQL Server via CI; do not treat committed tests as proof of passing tests until results arrive.
- The serialized payload format is SQL Server-specific; changing field order or encoding requires a new chain version.
- Recovery and truncation detection require externally stored sequence/hash anchors and backup controls.
- No production feature flags or remediation execution were enabled.
