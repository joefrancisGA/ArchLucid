# AZI-01 — Azure icon catalog and ARM-type resolver

**Wave:** azure-icons (**AZI**). **Depends on:** committed assets in `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/` (branch `cursor/azure-icons-starter-set-a0c9` or trunk after PR #3585). **Do not** draw SVG, touch the UI, or change layout.

Do not implement from `azure-icons-00-index.md`. Implement only *What to build*.

## Goal

A caller can pass an ARM resource type (and an optional ARM `kind`) and get either the matching PNG bytes or a clear miss. Unmapped types miss. The manifest is the only mapping table.

## Why

The PNGs and `azure-icon-manifest.json` are on disk and unused. Forest rendering should not parse JSON on every node, and it should not guess icons by filename. Load once from embedded resources.

## Context

- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json` — `version`, `icons[]` with `category`, `service`, `armTypes[]`, optional `kind`, `file`, optional `notes`
- `ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj` — no embedded assets yet (Docx template uses a conditional `None` + `CopyToOutputDirectory`; prefer **EmbeddedResource** for the icon pack so tests and published hosts do not depend on the working directory)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramKindResolver.cs` — category fallback; leave it
- `DiagramNode.ArmResourceType` exists. `DiagramNode` has **no** kind property. Do not add one in this prompt.

Shared ARM type in the manifest: `Microsoft.Web/sites` is both App Service (no `kind`) and Function App (`kind`: `functionapp`).

## What to build

1. Embed the manifest and every `*.png` in that folder as embedded resources. Assert the manifest resource name with `Assembly.GetManifestResourceNames()` in a test rather than guessing.

2. New types, one class per file, under `ArchLucid.ArtifactSynthesis/Layout/` (or `Icons/` if you add that folder — stay inside ArtifactSynthesis):

   - A catalog entry: service name, file name, optional kind, ARM types.
   - `AzureArchitectureIconCatalog` — loads the manifest + PNG bytes once (lazy static or a small instance created by the renderer later). Missing file referenced by the manifest throws at load with the file name. Extra PNGs not listed in the manifest are ignored.
   - `AzureArchitectureIconResolver.Resolve(catalog, armType, resourceKind)`:
     - Null/whitespace `armType` → miss.
     - **Exact** ordinal-ignore-case match on the full ARM type. No prefix match. `Microsoft.Network/virtualNetworks` must not hit `Microsoft.Network/loadBalancers`.
     - When several rows share that type, keep rows whose `kind` equals `resourceKind` (ordinal ignore case). If `resourceKind` is null or whitespace, keep rows whose `kind` is absent.
     - If that filter is empty, or more than one row remains → miss (do not pick an arbitrary icon).
     - One remaining row → return that row’s PNG bytes and file name.

3. Tests in `ArchLucid.ArtifactSynthesis.Tests` (new file, do not weaken existing pictogram tests):

   - `Microsoft.Compute/virtualMachines` → `virtual-machine.png`, non-empty PNG bytes.
   - `microsoft.network/loadbalancers` → `load-balancer.png` (case insensitive).
   - `Microsoft.Web/sites` with null kind → `app-service.png`.
   - `Microsoft.Web/sites` with kind `functionapp` → `function-app.png`.
   - `Microsoft.Web/sites` with kind `app` → miss (no row has kind `app`).
   - `Microsoft.EventGrid/topics` → `event-grid-topics.png`.
   - `Microsoft.EventGrid/systemTopics` → same topics file (manifest lists both types on that row).
   - `Microsoft.EventGrid/domains` → `event-grid-domains.png`, not the topics file.
   - `Microsoft.Compute/galleries` (unmapped) → miss.
   - `Microsoft.Network/virtualNetworks/subnets` → miss (no prefix).
   - Catalog load succeeds and every manifest `file` resolves to a PNG resource.

## Acceptance criteria

- Resolver behavior above is tested.
- No SVG emitter changes. No UI changes. No new files under `archlucid-ui/`.

## Constraints

- Working-tree safety before editing a tracked file. Exit 2 → skip and report.
- Do not download icons. Do not add SVG variants. Do not edit the manifest except to fix a JSON syntax error.
- C#: concrete types over `var`, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~AzureArchitectureIcon'`. Heartbeat every 8s if the run exceeds 15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
