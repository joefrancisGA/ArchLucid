# RSV-01 — Hide Recovery Services vaults on existing diagrams

**Wave:** Recovery Services vaults (**RSV**). **Depends on:** nothing. **Do not** add a diagram mode, a checkbox, a collector, or a protection edge. **Do not** implement RSV-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`Microsoft.RecoveryServices/vaults` nodes no longer appear on Executive, Architecture, Network, Security, Identity, Data, Data flow, Data architecture, Full subscription, Resource group, Selected resources, or Dependency neighborhood. The vault stays in the inventory snapshot and in the graph. This prompt only stops the compiler from placing it.

## Why

A vault with no protection evidence is a disconnected card. That is acceptable as data. It is noise on a topology diagram. Hiding it here makes room for a business-continuity view without pretending the vault is wired to its neighbors.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — `ApplyModeNodeFilter`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramKindResolver.cs` — `Contains("/vaults")` currently treats every vault as identity. Recovery Services must not take that path.
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs` — unmatched types fall through to compute. Leave that mapping alone in this prompt.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramArmTypeFriendlyName.cs`

## What to build

1. Add `DiagramRecoveryServicesVaultFilter.Exclude(nodes)` and call it at the end of every arm of `ApplyModeNodeFilter` **except** a mode that does not exist yet. Match ARM type `Microsoft.RecoveryServices/vaults` only. Do not match `Microsoft.KeyVault/vaults` or `Microsoft.DataProtection/backupVaults`.

2. In `DiagramInventoryPictogramKindResolver`, resolve Recovery Services vaults before the generic `/vaults` identity check. Use `DiagramInventoryPictogramKind.Compute` so the existing recovery-services-vault SVG category still applies. Key Vault stays identity.

3. Add `Microsoft.RecoveryServices/vaults` → `Recovery Services vault` in `DiagramArmTypeFriendlyName`.

4. Tests:
   - A graph with one vault and one VM, compiled as `DiagramMode.FullSubscription` and `DiagramMode.Executive`, contains the VM and omits the vault.
   - The same graph compiled as `DiagramMode.Data` still omits the vault.
   - A Key Vault node still compiles onto a mode that already shows Key Vault.
   - Friendly name for the Recovery Services ARM type is `Recovery Services vault`.

## Acceptance criteria

- No new `DiagramMode` value.
- No new relationship, hydrator, or Azure GET.
- `AzureInventorySnapshotSameResourceGroupEdgeHydrator` is unchanged.
- Key Vault diagrams and icons are unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramRecoveryServices|FullyQualifiedName~DiagramArmTypeFriendlyName|FullyQualifiedName~DiagramInventoryPictogram"
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
