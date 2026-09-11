> **Scope:** Contributor-reference — SecureNow architect outcome metrics API and headline field definitions. Internal engineering only.

# SecureNow architect outcome metrics (SA-11)

Rule version: **`SA11-metrics-v1`**

Headline metrics compare Azure inventory snapshot **from** → **to** and describe **architecture outcomes**, not ticket burn-down.

## API

`GET /v1/operational-security/architect-metrics?fromSnapshotId={guid}&toSnapshotId={guid}`

Requires ReadAuthority. Both snapshots must belong to the current tenant workspace/project scope.

## Headline fields

| Field | Definition |
|-------|------------|
| **criticalOrHighConfidencePathsRemoved** | Paths in `from` with confidence band Confirmed or HighlyLikely whose canonical hop hash is **absent** in `to` |
| **privilegedIdentityNodesOnPathsReduced** | Drop in distinct managed-identity node ids referenced by `USES_IDENTITY` hops across all paths (`max(0, from − to)`) |
| **unrestrictedEgressCapabilityPathsReduced** | Capability-to-flow paths with unrestricted egress in `from` whose hash is absent in `to` |
| **assertedCrownJewelExposurePathsRemoved** | Paths in `from` with a linked `CrownJewelAssertionId` whose hash is absent in `to` |
| **sharedControlBlastRadiusPathsRemoved** | Shared-control blast-radius paths in `from` whose hash is absent in `to` |
| **exceptionsExpired** | Operational exceptions with status Expired whose `expirationUtc` falls after the from snapshot anchor and on/before the to snapshot anchor |
| **remediationRecurrenceCount** | Distinct (`cloudResourceId`, `controlId`) pairs with Recurred status or reopened Open after a prior Closed finding in the comparison window |

## Path removed (v1)

**Path removed** means the canonical hop hash SHA-256 present in the earlier snapshot path set is **not present** in the later snapshot path set. Band improvement alone does not count as removal (avoids gameability).

## Supporting metrics

`supportingOperationalMetrics.openFindings` — current open + recurred operational finding count (IE-15 style). This is **not** a headline architecture outcome.

## Remediation factory UI

`SecureNowArchitectOutcomeMetricsPanel` on the remediation factory desk:

- Loads inventory snapshots (`useInfraEvidenceSnapshotsQuery`).
- Auto-selects the two newest snapshots as **from** / **to** when at least two exist.
- Calls `GET /v1/operational-security/architect-metrics?fromSnapshotId=&toSnapshotId=` on **Compare**.
- Renders headline fields as ordinal cards (no `%` confidence).
- Shows `SA11-metrics-v1` rule version for audit parity.

Copy: `securenow-architect-metrics-copy.ts` · API client: `securenow-architect-metrics-api.ts`.

## Defender secure score companion (IE-02)

`defender-summary.json` rows (`resourceId`, `secureScore` metadata only) materialize into `AzureInventoryDefenderSummaries` and surface on snapshot detail reads. Toxic-combination findings may include ordinal metadata `defenderSecureScoreBand` (`Low` / `Medium` / `High`) — never a numeric percentage in buyer output.

## Non-goals

- No LLM scoring
- No `findingsClosed` headline field
- No percentage confidence

## Snapshot anchors

Exception expiry windows use the later of `UpdatedUtc` / `CreatedUtc` on each snapshot header as the comparison anchor.
