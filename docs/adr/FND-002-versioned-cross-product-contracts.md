# ADR FND-002 — Versioned cross-product contracts

Status: Proposed, documentation-only foundation (2026-11-22).
Scope: ArchLucid ↔ SecureNow; no production behavior or autonomous execution is enabled.

## Decision
Introduce schema-first, explicitly versioned messages at product boundaries. Existing 1.0 APIs remain authoritative until each interface is inventoried and separately migrated. This ADR does not claim an existing universal contract implementation.

### Initial envelope (design proposal)
```json
{
  "contract": "architecture.snapshot.published",
  "schemaVersion": "1.0.0",
  "messageId": "uuid",
  "tenantId": "uuid",
  "occurredAt": "RFC3339 timestamp",
  "producer": "archlucid",
  "correlationId": "uuid",
  "payload": {},
  "evidenceRefs": []
}
```
Payload schema is selected by `contract` and `schemaVersion`; reject unknown major versions, invalid tenant context, invalid payloads and untrusted evidence references. An envelope is not proof of authorization or evidence authenticity.

### Contract families
1. ArchitectureSnapshotPublished: immutable snapshot reference, content digest, provenance, trust-boundary model.
2. SecurityFindingRecorded: finding identity, severity, affected asset, supporting evidence, validation state.
3. RemediationProposed: proposed changes, preconditions, blast-radius estimate, rollback plan; never execution authority.
4. RemediationDecisionRecorded: independent approver/policy decision, scope, expiry, audit reference.
5. RemediationVerificationRecorded: tests, deployment observation, residual risk, independent verification outcome.

### Compatibility
- Semantic versions: MAJOR breaking field/semantic change, MINOR backward-compatible optional addition, PATCH documentation or nonsemantic correction.
- Producers must publish a known schema version; consumers validate and reject unsupported major versions. Unknown optional fields may be ignored only where a schema permits it.
- Required fields cannot be silently removed or reinterpreted within a major version. Identifiers and tenant boundaries are immutable.
- Deprecation requires inventory of consumers, dual-read migration where necessary, contract tests, and an announced sunset; never silently rewrite sealed historical evidence.
- Store schema identifiers alongside historical records so replay uses the original schema.

### Trust and safety invariants
- Tenant identity is established by authenticated context, not accepted solely from a payload field.
- Cross-tenant references fail closed. Validate object-level authorization on each dereference.
- Evidence hashes and provenance must be verified independently; no self-attestation.
- Findings and remediation proposals are data, not authority to execute. Approval and execution are separate, auditable boundaries.
- Idempotency keys, correlation IDs, and replay handling must be defined per consumer; do not assume exactly-once delivery.
- No 2.0 module is enabled by this ADR; 1.0 release gates retain priority.

## Acceptance gates before implementation
- Inventory actual producer/consumer endpoints and DTOs on current release branch.
- Publish machine-readable JSON Schemas or equivalent per contract, with positive/negative fixtures.
- Add producer/consumer compatibility tests including major-version rejection, cross-tenant rejection, duplicate/replay, and malformed evidence.
- Validate CI and security gates; obtain architecture review before any live migration.

## Follow-up
FND-005 owns the canonical evidence schema. FND-004 owns experimental feature isolation. This ADR defines only the cross-product boundary and migration policy.
