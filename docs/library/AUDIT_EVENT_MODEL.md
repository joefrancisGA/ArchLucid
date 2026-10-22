> **Scope:** Canonical definition of the ArchLucid audit event — field meanings, channel taxonomy, immutability guarantees, and what distinguishes an audit event from an application log. Audience: buyers, GRC reviewers, operators, and engineers integrating with the audit API. Does not replace [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md) (which maps API operations to event types) or [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md) (which defines hot/warm/cold lifecycle).
>
> **Status:** current

# Audit event model

## Purpose

This document answers three questions that operational and diligence audiences ask frequently:

1. **What is an audit event?** How does it differ from an application log or a finding?
2. **What fields does an audit event carry?** What do those fields mean for evidence and traceability?
3. **What immutability guarantees apply?** How is the audit trail protected from modification?

---

## What is an audit event?

An **audit event** is a structured, persisted record of an authenticated action taken in the system. It is:

- **Actor-bound** — every event records who acted (human user or service identity).
- **Scope-bound** — every event records the tenant, workspace, and project context.
- **Append-only** — events are never modified or deleted through the application tier after creation.
- **Queryable** — events are exposed through the `/v1/audit` API for operator review and compliance export.

An audit event is **not**:

- An application log line (`ILogger` output). Log lines are informational, unstructured relative to events, and not retention-governed the same way.
- A finding. A finding is a decisioning observation about architecture; an audit event is a ledger entry about an action.
- A baseline mutation log entry. Baseline mutation logs (see §3 below) are structured log lines that do **not** write a `dbo.AuditEvents` row unless explicitly bridged.

---

## Audit channels

ArchLucid writes to three distinct channels. Only the **durable SQL channel** is the authoritative audit trail.

| Channel | Storage | What it captures | Queryable via API? |
|---------|---------|-----------------|-------------------|
| **Durable SQL audit** | `dbo.AuditEvents` | State-changing actions across reviews, governance, provisioning, and integrations. | Yes — `/v1/audit`, `/v1/audit/search`, `/v1/audit/export` |
| **Baseline mutation log** | Structured `ILogger` output | Architecture and governance baseline changes (coordinator / authority pipeline). Written as structured log lines only; a durable echo row is also written for core review lifecycle events. | No — SIEM / log pipeline only |
| **Platform audit** | `dbo.PlatformAuditEvents` | Cross-tenant operator actions (e.g. `TenantDataDeleted`). Not filtered by tenant session scope. | Not through the tenant-scoped API |

When this document uses **audit event** without qualification, it means a row in `dbo.AuditEvents` accessible through the tenant-scoped audit API.

---

## Audit event fields

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `EventId` | `Guid` | Yes | Unique identifier for this event. Set at creation; never reused. |
| `OccurredUtc` | `DateTime` | Yes | UTC timestamp at which the action occurred. Set at creation from the system clock. |
| `EventType` | `string` | Yes | Domain-specific event category. Values come from the `AuditEventTypes` constant catalog in `ArchLucid.Core`. Examples: `RunCreated`, `GovernanceApprovalSubmitted`, `ManifestPromoted`. See [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md) for the full catalog. |
| `ActorUserId` | `string` | Yes | Internal identifier of the actor (typically the Entra ID object ID or API key identifier). |
| `ActorUserName` | `string` | Yes | Display name of the actor for human-readable audit views. |
| `ExplicitActor` | `bool` | No | When `true`, the actor fields were set by the caller (e.g. a vendor inbound webhook with a service identity) and are not replaced from HTTP claims. |
| `TenantId` | `Guid` | Yes | Tenant scope of the event. All tenant-scoped API queries filter on this field. |
| `WorkspaceId` | `Guid` | Yes | Workspace scope of the event. |
| `ProjectId` | `Guid` | Yes | Project scope of the event. |
| `RunId` | `Guid?` | No | The review session associated with the event. `null` for actions that are not tied to a specific review (e.g. policy pack creation, user provisioning). |
| `ManifestId` | `Guid?` | No | The signed manifest associated with the event. `null` when not applicable. |
| `ArtifactId` | `Guid?` | No | The artifact associated with the event. `null` when not applicable. |
| `DataJson` | `string` | No | Event-specific JSON payload. Schema is event-type-specific; documented on the corresponding `AuditEventTypes` constant. Defaults to `{}`. |
| `CorrelationId` | `string?` | No | Optional correlation token linking related operations (e.g. an HTTP request trace ID or a job execution ID). Enables cross-request forensics via `/v1/audit/search?correlationId=…`. |

### Field coverage guarantees

- **Scope triple** (`TenantId` / `WorkspaceId` / `ProjectId`) is always set on every event. The API enforces tenant-scoped access; events for tenant A are never returned to tenant B queries.
- **Actor fields** are always set. For inbound webhook events with `ExplicitActor = true`, the actor represents the external service identity rather than the authenticated HTTP caller.
- **`RunId`**, **`ManifestId`**, and **`ArtifactId`** are optional and meaningful only for events in those domains. Their presence allows an auditor to reconstruct the full lifecycle of a review without cross-referencing multiple tables.
- **`DataJson`** payload structure varies by event type. It is not indexed; use `EventType` + scope fields for structured queries. `DataJson` is redacted in export profiles where sensitive payloads (e.g. policy violation details) are buyer-configurable — see [`PROOF_PACK_REDACTION_PROFILES.md`](PROOF_PACK_REDACTION_PROFILES.md).

---

## Immutability guarantees

### Application-tier enforcement

`IAuditRepository.AppendAsync` is the only write path. The application has no `Update` or `Delete` method on `IAuditRepository`. Code that wants to "correct" an event must append a new compensating event.

### Database-tier enforcement

Migration `051_AuditEvents_DenyUpdateDelete.sql` issues `DENY UPDATE` and `DENY DELETE` on `dbo.AuditEvents` to the `ArchLucidApp` database role. This closes the gap where a SQL bug or ad-hoc connection could mutate rows under the application identity.

- The `dbo` / `db_owner` role is not covered by these denials — break-glass maintenance under an elevated principal remains possible and is separately audited.
- Local development environments often run as `dbo` (no `ArchLucidApp` role), so the denial is inactive in development. The production deployment must create the role and assign the managed identity to it before this control is active.

### What this means for diligence

Audit rows written by the application principal cannot be modified or deleted by that same principal. An attacker who compromises the application tier cannot silently rewrite audit history. Modification requires break-glass database access, which is itself a logged and controlled action.

This does **not** constitute a cryptographic guarantee equivalent to a signed immutable ledger. If your compliance posture requires cryptographic non-repudiation, export audit events to Azure Blob Storage with immutable/WORM policy enabled (see [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md)).

---

## Relationship to the evidence trail

An audit event is one layer of the **evidence trail** (defined in [`GLOSSARY.md`](GLOSSARY.md)). The full evidence trail for a review includes:

1. **Input artifacts** — repository snapshots, uploaded documents, context ingestion records.
2. **Agent traces** — the deterministic steps from input to finding/summary output.
3. **Findings and decisions** — the decisioning outputs and reviewer dispositions.
4. **Audit events** — the ledger of authenticated actions (who submitted, who approved, who promoted, when).
5. **Signed manifest** — the authority-closing record that binds lineage to a committed state.

Audit events answer "who did what and when." They do not by themselves answer "why the findings say what they say" — that is the job of agent traces and evidence citations.

---

## Related docs

- [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md) — maps every state-changing API operation to the audit event type(s) it emits.
- [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md) — hot/warm/cold retention tiers and export guidance.
- [`GLOSSARY.md`](GLOSSARY.md) — canonical definitions of audit trail, evidence trail, finding, decision.
- [`security/MULTI_TENANT_RLS.md`](../security/MULTI_TENANT_RLS.md) — tenant isolation model that underpins scope enforcement on audit queries.
- ADR [`0034`](../architecture/adrs/0034-segregation-of-duties-entra-oid-actor-keys.md) — how actor keys are canonicalized for segregation-of-duties enforcement.
