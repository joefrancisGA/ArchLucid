# DRR-04 — Icon catalog honesty

**Wave:** diagram regression repair (**DRR**). **Depends on:** trunk. **Parallel with DRR-01.** Do not edit data-flow layout or edge ink.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A forest card shows an Azure icon only when the catalog entry is that service. Shared PNG bytes are not two products. Function Apps pass ARM `kind`. A CDN profile is not Front Door. Types without a distinct icon keep the category pictogram.

## Why

`AzureArchitectureIconCatalog.Resolve` can take a kind, and the manifest marks Function App as `Microsoft.Web/sites` + `functionapp`. `DiagramForestCanvasLabelContext.Measure` calls `Resolve(node.ArmResourceType)` only. `DiagramNode` has no kind field. `container-apps.png` and `container-instances.png` are byte-identical, as are `event-grid-domains.png` and `event-grid-subscriptions.png`. The Front Door entry lists `Microsoft.Cdn/profiles`, so every CDN profile gets that icon. The VPN entry’s note says ExpressRoute needs another icon, but every `Microsoft.Network/virtualNetworkGateways` resolves to `vpn-gateway.png`.

## Context

- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs` — `Resolve(node.ArmResourceType)`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — `image.azure-icon`, `preserveAspectRatio="xMidYMid meet"`
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs` — no kind today
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — `BuildDiagramNode`
- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` stores ARM `kind` on graph `properties["kind"]`
- Owner rule `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`: do not vendor a new zip here; do not crop, flip, or recolor the mark; a type with no icon keeps the pictogram
- Tests: `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`

## What to build

1. Add `DiagramNode.ArmResourceKind` (nullable string). Set it in `BuildDiagramNode` from graph `properties["kind"]` when that value is non-empty. Do not invent kind from the resource name.

2. `Measure` calls `Resolve(node.ArmResourceType, node.ArmResourceKind)`.
   - `Microsoft.Web/sites` with kind `functionapp` emits `data-file="function-app.png"`.
   - `Microsoft.Web/sites` with null kind still emits `app-service.png`.
   - Add a renderer or metrics test for the function-app case. The catalog theory test already expects this pair; keep it.

3. Duplicate bytes. On current trunk these pairs hash equal:
   - `container-apps.png` / `container-instances.png`
   - `event-grid-domains.png` / `event-grid-subscriptions.png`
   Remove the **second** manifest entry and stop embedding the duplicate file:
   - Drop Container Instances (`Microsoft.ContainerInstance/containerGroups`).
   - Drop Event Grid Subscriptions (`Microsoft.EventGrid/eventSubscriptions`).
   - Keep Container Apps and Event Grid Domains.
   - `Resolve` for the dropped ARM types returns null (pictogram).
   - Add a test that loads every embedded PNG once and fails when two files share a SHA-256.

4. Front Door arm types become only `Microsoft.Network/frontDoors` and `Microsoft.Cdn/profiles/afdEndpoints`. `Resolve("Microsoft.Cdn/profiles")` returns null. Do not add a CDN icon in this prompt.

5. Virtual network gateways: one icon for every `Microsoft.Network/virtualNetworkGateways` until a gateway type is actually plumbed. Rename that entry’s `service` to `Virtual network gateway`. Keep the file `vpn-gateway.png`. Do not draw a second ExpressRoute mark.

6. Leave `preserveAspectRatio="xMidYMid meet"` and the 28px pictogram slot. Do not crop, scale non-uniformly, or recolor icon pixels.

7. Do not download the Azure Architecture Center zip. Do not add SVG files. Do not replace the 18×18 PNGs with new art.

## Acceptance criteria

- Function Apps and App Services use different `data-file` values when kind is present.
- Container Instances and Event Grid subscriptions render the category pictogram.
- A CDN profile does not render `front-door.png`.
- No two remaining icon files are byte-identical.
- Card labels still show the resource name next to the icon.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not reopen IDA, IDF, or IDX as an icon importer. Official SVG vendoring is a later owner-supplied pack, not this chat.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~AzureArchitectureIconCatalogTests|FullyQualifiedName~AzureArchitectureIconForestSvgTests|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
