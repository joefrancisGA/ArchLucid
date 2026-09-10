# Federated CI identity adapter (SA-19)

Optional ZIP sibling evidence for GitHub Actions / Azure DevOps OIDC federated credentials mapped to Entra service principals and Azure RBAC.

## Why

Developer → repo admin → workflow → federated identity → Contributor is transitive production authority without Azure RBAC on the human. This path family is separate from the Azure spine collector and must **fail soft** when absent.

## ZIP sibling

Optional file: `federated-credentials.json` (array)

| Field | Required | Notes |
|-------|----------|-------|
| `issuer` | yes | OIDC issuer URL |
| `subject` | yes | Federated credential subject claim |
| `principalId` | yes | Entra service principal object id |
| `appId` | no | App registration id when known |
| `parentResourceId` | no | Managed identity or app ARM id |
| `credentialName` | no | Credential display name |
| `provenanceKind` | no | `ObservedFact` (ARM GET) or `HumanAssertion` (customer file; default) |
| `evidenceHashSha256` | no | Hex SHA-256 of row payload |

## Graph projection (SA-02)

When issuer, subject, and principal id are present, materialize:

- Edge: `FEDERATES_AS`
- From: `federated-credential://{hash}`
- To: `azure-ad://principal/{principalId}`
- Provenance: row `provenanceKind`

## Privilege engine (SA-03)

`InventoryPrivilegePathGraph` traverses `FEDERATES_AS`. Paths emit findings titled **"Federated deployment identity → …"** — not "this developer" unless separate GitHub admin evidence exists (out of scope).

## Completeness

When `federated-credentials.json` is **absent**, materialize adds warning:

`federated-credentials.json missing: privilege paths cannot traverse CI federated identity`

Empty file present → no warning, no edges. Azure-spine engines continue.

## Collector note

Hosted path does not request GitHub org admin or Entra Global Reader. Populate via ARM `federatedIdentityCredentials` GET within existing Reader scope in the extractor, or customer-supplied ZIP rows labeled `HumanAssertion`.
