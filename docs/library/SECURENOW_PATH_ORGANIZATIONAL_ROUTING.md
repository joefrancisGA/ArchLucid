# SecureNow path organizational routing (SA-15)

Organizational routing fields attach **who moves the org** to a path — without inventing Entra display names.

## Storage

Migration **385** — `dbo.SecurityEvidencePathRouting`

| Column | Purpose |
| --- | --- |
| PathId | Cited SecureNow path |
| FindingId | Optional finding link (nullable in v1 tag sync) |
| RoutingRole | BusinessOwner, TechnicalOwner, SecurityOwner, Remediator, VerificationOwner, RequiredApproval |
| PrincipalId / DisplayName | From tag value or human assertion — never guessed |
| ProvenanceKind | **DerivedFact** (tags) or **HumanAssertion** only |
| SourceReference | e.g. `tag:owner@/subscriptions/.../storageAccounts/sa` |

**ObservedFact** (and AI-inferred owners) are **rejected** on insert.

## Tag mapping (case-insensitive)

| Azure tag key | Routing role |
| --- | --- |
| `owner` | BusinessOwner |
| `technicalOwner` | TechnicalOwner |
| `application` | TechnicalOwner (fallback when `technicalOwner` absent) |
| `securityOwner` | SecurityOwner |
| `remediator` | Remediator |
| `verificationOwner` | VerificationOwner |
| `costCenter` | RequiredApproval |

Missing tags → **no routing rows** (GET returns empty `routing` array). Internal empty reason: `no-owner-tag` — not exposed as a fabricated principal.

Tags are collected from **CloudResourceId** hops on the path snapshot.

## Separation of duties

- Remediator **≠** VerificationOwner
- Remediator **≠** RequiredApproval (approver)

## Sync

`SecurityEvidencePathRoutingSyncService.SyncSnapshotAsync` runs after path materialization (post-materialize full + incremental downstream pipelines).

## API

`GET /v1/operational-security/paths/{pathId}` includes `routing[]` with role, principal, provenance, and source reference.

## Non-goals

- No CMDB collector
- No AI-invented owners (SA-17 summaries cite existing routing fields only)
