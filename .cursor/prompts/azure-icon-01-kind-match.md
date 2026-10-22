# AZI-01 — Azure icon kind match

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement AZI-02, AZI-03, or AZI-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Azure icon coverage (**AZI**). **Depends on:** the ten-icon catalog already in the tree (`Assets/AzureIcons/azure-icon-manifest.json` and `Assets/AzureIcons/Svg/`).

## Goal

A mapped ARM type draws its official icon when the live resource has an ARM kind. Function Apps still win over App Service when the kind is a function app, including Linux.

## Why

`AzureArchitectureIconCatalog.Resolve` treats a blank catalog kind as "the resource kind must also be blank." Inventory copies the ARM kind onto the node. A storage account (`StorageV2`), an App Service (`app` or `app,linux`), and Cosmos DB (`GlobalDocumentDB`) therefore miss rows that are already in the manifest. A Function App whose kind is `functionapp,linux` misses the Function Apps row, which requires the exact string `functionapp`, and also misses App Service, which requires a blank kind. The card then draws a category pictogram.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs` (`ReadKind` only — do not change it)

## What to build

1. Branch `azi/01-kind-match` from the branch that already contains the ten-icon catalog. Do not branch from `revert/diagram-icon-layout-3585-3592`.
2. Change only `Resolve` in `AzureArchitectureIconCatalog`. Do not add SVGs. Do not edit the manifest. Do not change the renderer, the sanitizer, or layout.
3. Match in this order. Compare with ordinal ignore case after trimming both strings.
   - Collect entries whose `armTypes` contain the requested ARM type.
   - When the resource kind is non-blank, look for entries whose own kind is non-blank and either equals the resource kind or is the resource kind's first comma-separated token. `functionapp` matches `functionapp`, `functionapp,linux`, and `functionapp,linux,container`. `functionapp` does not match `functionapplication`. If exactly one entry matches, return it. If more than one matches, return null.
   - Otherwise return the single entry for that ARM type whose kind is blank. That is the default icon. A storage account with kind `StorageV2` resolves to Storage Accounts. An App Service with kind `app,linux` resolves to App Services. A virtual machine with any kind resolves to Virtual Machine.
   - If there is no blank-kind entry, or more than one, return null.
4. A blank resource kind uses only the blank-kind entry. `Microsoft.Web/sites` with no kind stays App Services.
5. Keep the existing manifest kind value `functionapp`. Do not add a kind to the App Service, Storage, or Cosmos rows.

## Acceptance criteria

- `Resolve("Microsoft.Web/sites", "functionapp")` is Function Apps.
- `Resolve("Microsoft.Web/sites", "functionapp,linux")` is Function Apps.
- `Resolve("Microsoft.Web/sites")` and `Resolve("Microsoft.Web/sites", "app,linux")` are App Services.
- `Resolve("Microsoft.Storage/storageAccounts", "StorageV2")` is Storage Accounts.
- `Resolve("Microsoft.DocumentDB/databaseAccounts", "GlobalDocumentDB")` is Azure Cosmos DB.
- `Resolve("Microsoft.Compute/virtualMachines")` is still Virtual Machine.
- `Resolve("Microsoft.Example/unknown")` is null.
- The existing renderer test still emits `class="azure-icon"` for a virtual machine and `class="pictogram"` for an unmapped type.
- Rendered SVG still has no `data:image/png` and no `https://` image href.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not copy SVGs out of the zip. Do not restore PNGs from `1460498a65` or `f49c801263`.
- Do not change subscription-frame rules, data-flow placement, edge ink, or outline structure.
- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and look at a storage account, an App Service, a Linux Function App, and a Cosmos DB account. Each of those cards should show the official mark already embedded for that service. An unmapped type should still be a category pictogram. Wait for that look before any commit.
