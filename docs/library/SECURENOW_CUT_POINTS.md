# SecureNow cut-point analysis (SA-10)

Rule version: **`SA10-cut-v1`**

Cut points identify nodes or edges whose removal would collapse the most **ranked** paths on a snapshot. Output is advisory only — nothing is applied automatically.

## Operational cost classes

| Class | Typical change | Cost weight |
|-------|----------------|-------------|
| **PublicAccessProperty** | Disable public network access on a resource | 1 |
| **PrivateEndpointDns** | Private endpoint + DNS rollout | 2 |
| **NetworkNsG** | NSG / route / egress rule change | 3 |
| **RoleAssignment** | Role assignment or shared managed identity segmentation | 4 |
| **IdentityFederation** | Federated deploy / CI identity trust change | 5 |
| **Unknown** | Unclassified hop or node | 3 |

Higher weight = harder operational change.

## Leverage score

```
LeverageScore = (PathsCollapsed × PathsCollapsed) / OperationalCostWeight
```

Squaring collapse count ensures a shared choke point (e.g. one managed identity on three paths) outranks three disjoint single-path public-exposure cuts. When collapse counts are equal, the cheaper operational cost class wins via the divisor.

Cut points are ordered by leverage descending, then `PathsCollapsedCount` descending, then stable `CutKey`.

## Persistence

- `SecurityEvidenceCutPoints` — one row per distinct node/edge cut key per snapshot (replaced after ranking)
- Each row stores `CollapsedPathIdsJson` citing affected path ids and `EvidenceReferencesJson` from contributing hops

## APIs

Cut points surface on:

- `GET /v1/operational-security/paths/{pathId}` — `relatedCutPoints`
- `GET /v1/operational-security/paths/ranked` — `topCutPoints` for the snapshot plus `relatedCutPoints` on each ranked item

## Optional remediation pattern hint

When a cut point carries a `resourceType` and exactly one **Approved** remediation pattern matches that type, `suggestedPatternKey` is populated. Multiple matches fail closed (no suggestion). AI cannot write cut-point rows.

## Relation to IE-10 / IE-11

Remediation patterns remain finding-scoped for execution eligibility. Cut-point pattern hints are read-only suggestions for factory operators — not ExactMatch automation from cut-point analysis alone.
