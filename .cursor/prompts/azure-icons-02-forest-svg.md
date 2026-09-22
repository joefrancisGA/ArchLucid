# AZI-02 — Product icon on inventory-forest cards

**Wave:** azure-icons (**AZI**). **Depends on:** AZI-01 merged (catalog + `AzureArchitectureIconResolver`). **Do not** change card geometry, edges, frames, legend rows, or the UI sanitize path (AZI-03).

Do not implement from the wave index. Implement only *What to build*.

## Goal

When the resolver hits, the forest card’s icon slot shows that PNG. When it misses, the card keeps today’s category pictogram. The 4 px category accent stays either way.

## Why

`DiagramForestNodeSvgEmitter` always calls `DiagramInventoryPictogramSvgEmitter`. That is the live inventory canvas (`layoutSvg`). Product icons belong in that slot, at the existing pictogram size, so layout math does not move.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — draws `rect.node-card`, `rect.node-accent`, then the pictogram at `pictogramX` / `pictogramY` with `options.PictogramSize`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs` — sets `PictogramKind` from `DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType)`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeMetrics.cs` — no icon bytes today
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs` — `ArmResourceType` only; pass **null** resource kind into the resolver
- PNG export of the forest SVG must not depend on a file path. Embed the PNG as a data URI.

## What to build

1. Thread the resolved icon into forest metrics (new optional field, or a sibling lookup the emitter can call). Prefer storing the file name plus bytes (or a ready data URI) on the metrics object so the emitter stays free of catalog I/O. Build the catalog once per render, not once per node.

2. `DiagramForestNodeSvgEmitter`: when an icon is present, emit `<image>` instead of `g.pictogram`:
   - `class="azure-icon"`
   - `data-file` = manifest file name (for tests)
   - `x`, `y`, `width`, `height` = the current pictogram slot (`options.PictogramSize`)
   - `href` **and** `xlink:href` set to `data:image/png;base64,{bytes}` so both SVG 2 and older serializers keep the image
   - `preserveAspectRatio="xMidYMid meet"`
   - Declare `xmlns:xlink="http://www.w3.org/1999/xlink"` on the root `<svg>` if it is not already there (renderer root, not only the node group)
   - Do not add a second pictogram behind the image.

3. When the resolver misses, call `DiagramInventoryPictogramSvgEmitter` exactly as today.

4. Pass `resourceKind: null` from the forest path. `Microsoft.Web/sites` renders **App Service** until a future prompt threads ARM kind. Do not invent kind plumbing here.

5. Tests (extend forest renderer tests or add `AzureArchitectureIconForestSvgTests`):
   - A node with `ArmResourceType` `Microsoft.Compute/virtualMachines` contains `<image` with `class` containing `azure-icon`, `data-file="virtual-machine.png"`, and `href` starting with `data:image/png;base64,`.
   - That node does **not** contain `g` with `class="pictogram"`.
   - A node with an unmapped type (for example `Microsoft.Compute/galleries`) still contains `class="pictogram"` and does not contain `azure-icon`.
   - Both nodes still contain `rect.node-accent`.
   - `Microsoft.Network/loadBalancers` uses `load-balancer.png`, not `virtual-network.png`.
   - Card width/height options are unchanged (do not edit `DiagramForestLayoutOptions` numbers).

## Acceptance criteria

- Mapped forest nodes show the embedded PNG in the existing icon slot.
- Unmapped forest nodes still show the category pictogram.
- Accent bar, labels, and node size rules are unchanged.

## Constraints

- Working-tree safety before editing a tracked file. Exit 2 → skip and report.
- Do not edit `archlucid-ui` in this prompt (sanitize is AZI-03).
- Do not change Graphviz labels.
- Do not retune spacing, frames, or Mermaid.
- C#: concrete types over `var`, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~AzureArchitectureIcon|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramInventoryPictogram'`. Heartbeat every 8s if the run exceeds 15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
