# AZI-04 — Ratchet mapped icons and pictogram fallback

**Wave:** azure-icons (**AZI**). **Depends on:** AZI-01, AZI-02, and AZI-03 merged. **Do not** add new icons or change layout.

Do not implement from the wave index. Implement only *What to build*.

## Goal

One test file makes the contract obvious: known starter-set ARM types embed their PNG; unknown types keep `g.pictogram`; the accent bar remains; the legend does not name products.

## Why

AZI-01–03 can pass individually while a later edit deletes the fallback or points every network type at the VNet icon. This prompt only adds the lock.

## What to build

Add `AzureArchitectureIconRatchetTests` (name flexible) in `ArchLucid.ArtifactSynthesis.Tests` that renders a small forest (or calls the same renderer the forest tests use) and asserts:

| ARM type | Expect |
|----------|--------|
| `Microsoft.Compute/virtualMachines` | `data-file="virtual-machine.png"`, no `class="pictogram"` on that node |
| `Microsoft.Storage/storageAccounts` | `storage-account.png` |
| `Microsoft.Sql/servers/databases` | `sql-database.png` |
| `Microsoft.DocumentDB/databaseAccounts` | `cosmos-db.png` |
| `Microsoft.Network/applicationGateways` | `application-gateway.png` |
| `Microsoft.Network/privateEndpoints` | `private-endpoint.png` |
| `Microsoft.KeyVault/vaults` | `key-vault.png` |
| `Microsoft.ContainerService/managedClusters` | `aks.png` |
| `Microsoft.Web/sites` | `app-service.png` (kind is null on `DiagramNode`) |
| `Microsoft.Compute/galleries` | `class="pictogram"`, no `azure-icon` |
| `Microsoft.Network/virtualNetworks/subnets` | pictogram, not the VNet icon |

Also assert:

- Every node above still has exactly one `rect.node-accent`.
- Rendered SVG does not contain `http://` or `https://` inside an `azure-icon` href.
- Legend text for this fixture does not contain `Virtual Machine` or `Storage Account`.

If a listed ARM type is missing from the manifest, fail the test with that type name. Do not silently skip the row.

Do not duplicate the entire manifest. These rows are the ratchet sample.

## Acceptance criteria

- The filter `FullyQualifiedName~AzureArchitectureIconRatchet` passes.
- No production behavior change beyond what the tests already required.

## Constraints

- Working-tree safety before editing a tracked file. Exit 2 → skip and report.
- No UI work unless AZI-03’s Vitest is already failing; then fix sanitize only.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~AzureArchitectureIcon'`. Heartbeat every 8s if the run exceeds 15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
