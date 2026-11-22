# FND-002 — Source-level contract inventory (initial)

Checked against repository default-branch source on 2026-11-22. This is an initial mapping, not an exhaustive endpoint inventory.

| Concern | Existing source | Mapping / migration |
| --- | --- | --- |
| Architecture graph | `ArchLucid.Contracts/Persistence/Graph/GraphSnapshot.cs` | `GraphSnapshotId`, `ContextSnapshotId`, `RunId`, `CreatedUtc` map to proposed event payload; existing integer `SchemaVersion` remains unchanged |
| Findings | `ArchLucid.Contracts/Findings/Finding.cs` | `FindingId`, `FindingSchemaVersion`, `EvidenceRefs`, `HumanReviewStatus` inform later SecurityFindingRecorded; do not convert confidence into verified evidence |
| Existing integration events | `schemas/integration-events/README.md`, `schemas/integration-events/catalog.json` | Existing JSON Schema Draft 2020-12, AsyncAPI and event catalog stay authoritative for existing messages |
| Strict version reader | `ArchLucid.Core/Json/StrictSchemaVersionReader.cs` | Accepts whole-number legacy schema versions; do not route semantic versions through it |
| Proposed boundary | `schemas/cross-product/architecture-snapshot-published/1.0.0.schema.json` | New isolated, versioned contract; not wired into transport |

## Open implementation questions
- Identify actual graph publishing endpoint/transport and SecureNow consumer; no binding is asserted yet.
- Determine authoritative tenant identity from authenticated context, not a graph DTO field.
- Compute digest from canonical persisted snapshot bytes with a documented algorithm; never synthesize or trust caller-supplied digest.
- Specify evidence reference validation, replay/idempotency storage, authorization, and audit.
- Validate compatibility with release CI before enabling any producer.

The schema is a **proposal**; the example fixture is synthetic and does not establish provenance, tenant authorization, or successful deployment.
