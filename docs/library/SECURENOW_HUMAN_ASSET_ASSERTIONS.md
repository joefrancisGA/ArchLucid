# Human security asset assertions (SA-18)

Decay-bound human claims for cloud resource sensitivity, regulatory class, deployment environment, and business criticality. **ProvenanceKind is always HumanAssertion** — never inferred from resource names or LLM output.

## Why

A public marketing PDF store and a private patient SQL database are not equivalent. Without decaying human context, crown-jewel ranking either treats everything as critical or nothing as critical.

## Model

`SecurityAssetAssertion` is scoped to one `CloudResourceId` per active row. Classification fields:

| Field | Purpose |
|-------|---------|
| `DataSensitivity` | Public through PHI |
| `RegulatoryClass` | HIPAA, PCI, etc. |
| `DeploymentEnvironment` | Production vs non-production |
| `BusinessCriticality` | Low through CrownJewel |
| `IsRevenueImpact` / `IsPatientImpact` | Optional impact flags |

**ExpirationUtc is required** on create and renew. Maximum duration: 365 days (same band as IE-12 exceptions).

Crown-jewel ranking linkage applies when an assertion **qualifies** (`BusinessCriticality = CrownJewel`, `DataSensitivity = Phi`, or `IsPatientImpact = true`).

## APIs

Base route: `v1/operational-security/asset-assertions`

| Method | Route | Authority | Behavior |
|--------|-------|-----------|----------|
| GET | `/` | Read | List tenant assertions; read-side expiry sweep |
| POST | `/` | Execute | Create assertion (SoD: approver ≠ requester) |
| POST | `/{assertionId}/renew` | Execute | Extend expiration on active assertion |
| POST | `/{assertionId}/revoke` | Execute | Revoke active assertion |
| POST | `/sweep-expired` | Execute | Mark expired rows; emit finding observations |

Responses include `provenanceKind: HumanAssertion` and `qualifiesAsCrownJewel`.

## Distinction from IE-12 exceptions

`OperationalSecurityException` suppresses finding visibility. `SecurityAssetAssertion` supplies **decaying business context** for ranking — separate type, separate lifecycle.

## Ranking hook (SA-09)

`PathRankingEngine` loads active crown-jewel assertion IDs before scoring. When `CrownJewelAssertionId` on a path points to an expired or revoked assertion, **BusinessConsequenceScore** returns to Unknown (neutral composite sort).

`ISecurityAssetAssertionResolver` is available for path engines to resolve assertion IDs from hop `CloudResourceId`s during materialization.

## Expiry observations

When an assertion expires, related operational security findings for the same `CloudResourceId` receive an observation (`SourceSystem = ArchLucid.AssetAssertionExpiry`) — same pattern as IE-12 exception expiry.

## Migration

`387_SecurityAssetAssertions.sql` — table + optional FK from `SecurityEvidencePaths.CrownJewelAssertionId`.
