# FND-010 durable authorization decision journal

This increment replaces the runtime logging-only authorization audit registration with a SQL Server insert-only journal. Migration 354 creates `dbo.AuthorizationDecisionJournal` with a unique decision ID, exact tenant/workspace/project/resource scope, action, decision, reason, caller kind and timestamps. A database trigger rejects UPDATE and DELETE through ordinary DML. `SqlCentralAuthorizationAudit` uses parameterized INSERT, awaits completion, and propagates SQL failures. The centralized authorization service already fails closed when audit writing fails. If the SQL connection factory is unavailable, DI registers an unavailable audit sink that denies every authorization decision.

## Operational gates
- Apply migration 354 before deploying this service; otherwise all centralized authorization decisions fail closed.
- Grant the application identity INSERT on the journal, not UPDATE, DELETE, ALTER, or ownership. Restrict direct table access and enforce least privilege.
- SQL commit acknowledgement is durable only under the database's configured transaction log, HA, backup and disaster-recovery guarantees. The trigger does not prevent privileged administrators, schema changes, truncation, backup tampering, or physical database corruption. This is **not cryptographically immutable/WORM storage**.
- Configure retention, encrypted backups, audit-log export, and independent integrity monitoring before treating it as compliance-grade evidence.
- No live SQL integration test has been run; the focused tests cover missing-storage failure and the record shape. Required CI and real SQL migration/write/read/UPDATE/DELETE tests remain.
- Avoid enabling SecureNow until the journal and existing authorization stack pass security review.

This work does not activate remediation execution.
