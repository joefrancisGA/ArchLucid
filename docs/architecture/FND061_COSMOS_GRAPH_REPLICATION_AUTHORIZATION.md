# FND-061 authorization before Cosmos graph replication

The authority graph stage can queue replication before run finalization. The worker checks the complete tenant, workspace, project, run, and graph IDs against the active drain scope and uncached run metadata. It waits for an active run to commit and become readable, then verifies that the current scoped manifest seals the exact requested graph before opening the SQL graph body. The loaded snapshot must match the sealed graph, run, and context before the Cosmos write. Missing or mismatched identity, archived or failed runs, and a superseded graph are skipped. A corrupt or absent seal on a returned manifest is a terminal integrity failure.

Expected waits release only the currently held lease, set the next eligible attempt, and preserve the failure count. This uses the existing outbox columns. The disposable SQL test exercises stale and current leases, exact timestamp comparison, and delayed eligibility. No migration, replay, or update to historical data is part of this change.

This change builds on the committed-run evidence binding from the retrieval-indexing hardening. It does not certify post-commit projection work or change branch protection.
