# Entra group membership adapter (SA-20)

Optional ZIP sibling evidence and optional Microsoft Graph reads for Entra group `memberOf` relationships mapped to Azure RBAC principals.

## Why

User → group → Contributor is transitive production authority without direct RBAC on the human. Global Reader and directory dumps are out of the IE plane. This adapter must **fail soft** when absent or forbidden.

## Feature flag

Configuration section: `EntraGroupMembershipGraph`

| Setting | Default | Notes |
|---------|---------|-------|
| `Enabled` | `false` | When false, hosted collectors must not call Microsoft Graph |
| `MaxNestedDepth` | `5` | Caps nested group expansion during Graph collection |

## Graph scopes (least privilege)

Documented scopes — **not** Entra Global Reader:

| Scope | Use |
|-------|-----|
| `GroupMember.Read.All` | Preferred — read group direct members |
| `Group.Read.All` | Alternate when tenant policy requires broader group read |

Graph token uses `https://graph.microsoft.com/.default` with tenant-granted application permissions.

## ZIP sibling

Optional file: `entra-group-memberships.json` (array)

| Field | Required | Notes |
|-------|----------|-------|
| `memberId` | yes | Entra object id of member (user, service principal, or nested group) |
| `groupId` | yes | Entra group object id |
| `provenanceKind` | no | `ObservedFact` (Graph GET) or `HumanAssertion` (customer file; default) |
| `evidenceHashSha256` | no | Hex SHA-256 of row payload |

## Graph projection (SA-02)

When member and group ids are present, materialize:

- Edge: `MEMBER_OF`
- From: `azure-ad://principal/{memberId}`
- To: `azure-ad://principal/{groupId}`
- Provenance: row `provenanceKind`

## Privilege engine (SA-03)

`InventoryPrivilegePathGraph` traverses `MEMBER_OF`. Paths emit findings titled **"Group-nested privilege path → …"** when group membership evidence exists.

## PIM eligibility

When standing vs eligible PIM state cannot be distinguished (`pimEligibilityKind` is `unknown` or `eligible`), the `HAS_ROLE` hop uses inference source `pim-eligibility-unknown` and derived `CAN_READ` / `CAN_WRITE` edges are suppressed. Privilege paths surface **InsufficientEvidence**, not Confirmed Owner.

## Completeness

When `entra-group-memberships.json` is **absent**, materialize adds warning:

`entra-group-memberships.json missing: privilege paths cannot traverse group membership`

When Graph returns **403**, hosted collection logs:

`entra group membership Graph read forbidden (403): privilege paths cannot traverse group membership`

Empty file present → no missing-file warning, no edges. Azure-spine engines continue.

## Collector note

Hosted path uses the same ARM GET-only client family. Graph is an explicit optional merge when `EntraGroupMembershipGraph:Enabled` is true and the tenant grants documented scopes. Populate membership via Graph (ObservedFact) or customer-supplied ZIP rows labeled `HumanAssertion`.
