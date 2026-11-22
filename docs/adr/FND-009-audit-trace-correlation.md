# ADR FND-009 — Defense workflow audit correlation

Status: Proposed additive schema-only foundation, 2026-11-22.

## Existing authoritative audit architecture
- `docs/library/AUDIT_EVENT_MODEL.md` describes durable tenant-scoped `dbo.AuditEvents`, scope triple, actor, `EventId`, `CorrelationId`, `RunId` and append-only `IAuditRepository.AppendAsync`.
- `ArchLucid.Core/Audit/AuditEventTypes.Findings.cs` contains finding and verification event types; do not redefine them.
- `ArchLucid.Persistence/Migrations/051_AuditEvents_DenyUpdateDelete.sql` denies application-role update/delete when that role exists. It explicitly notes db_owner/break-glass exceptions and environments where the role is absent.
- `ArchLucid.Persistence/Migrations/055_AuditEvents_CorrelationId_RunId_Indexes.sql` supports correlation queries.

## Decision
A separate versioned defense-trace correlation **projection** links existing durable audit events and future FND-005 evidence, FND-007 proposals and FND-008 verification outcomes. It never replaces `dbo.AuditEvents` or claims that a proposed remediation was executed.

Each trace entry has tenant, correlation token, actor, stage, event reference, subject references and previous-event links. Approval-stage records require an explicit decision. Absence of an approval record does not imply approval.

## Trust boundaries
- JSON Schema validates shape only, not whether an audit event exists, is append-only, or is correctly authorized.
- Tenant, workspace, project and actor must be verified against the authoritative audit row and authenticated context; do not trust caller-supplied identifiers.
- Resolve previous-event links within the same tenant; reject cycles, missing links, and forged cross-tenant edges.
- Verify chronology and event types against trusted storage; a chain of identifiers alone is not tamper-evidence.
- Denied, expired or revoked approvals must never authorize execution.
- Execution and verification are distinct stages, and neither is inferred from a proposal or audit log message.
- Never claim universal SQL immutability: elevated database principals and deployment configurations may bypass application-role DENY protections.

## Future runtime gates
Implement an authorized read-model adapter over existing audit APIs, independently validate link integrity, add tenant/actor/approval replay tests and append-only storage protections before any operational use. No runtime changes in this PR.
