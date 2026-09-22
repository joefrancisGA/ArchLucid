# AZI-03 — Keep Azure icons after SVG sanitize; leave the legend categorical

**Wave:** azure-icons (**AZI**). **Depends on:** AZI-02 merged (forest `<image class="azure-icon">` with a PNG data URI). **Do not** add icons, change the resolver, or change layout.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A forest SVG that contains an Azure icon still contains that `<image>` after `sanitizeArchitectureDiagramSvg`. The on-canvas legend still lists category kinds (Compute, Network, Data, Storage, Identity), not one row per product icon.

## Why

`sanitizeArchitectureDiagramSvg` runs DOMPurify with the SVG profile. DOMPurify drops `data:` URLs unless an image tag is explicitly allowed to keep them. If the href disappears, the card slot is blank in the browser even though the .NET tests pass.

`DiagramForestLegendSvgEmitter` lists `DiagramInventoryPictogramKind`. Expanding it to 36 product names makes the legend larger than the diagram. Category color remains the accent bar; the product icon is the card glyph.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `sanitizeArchitectureDiagramSvg`, `paintArchitectureDiagramNodePalette`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.test.ts`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs` — `CollectUsedKinds` / `KindLabel`
- Paint selects `rect` nodes. An `<image>` is not a rect, but confirm the paint pass does not delete it.

## What to build

1. Vitest: build a minimal forest-like SVG string with `rect.node-card`, `rect.node-accent`, and `<image class="azure-icon" href="data:image/png;base64,iVBORw0KGgo=" xlink:href="data:image/png;base64,iVBORw0KGgo=" />` (a tiny valid PNG prefix is enough). Run `sanitizeArchitectureDiagramSvg`. Expect the result to contain `azure-icon` and `data:image/png;base64,`.

2. If DOMPurify strips it, widen the sanitize config **only** enough to keep `data:image/png;base64,` on SVG `<image>` `href` / `xlink:href`. Do not allow `javascript:`, `http:`, or `https:` image hrefs. Do not allow `<script>` or `foreignObject`.

3. Same fixture: after sanitize, `rect.node-accent` fill is unchanged (paint must not restyle the image, and must not remove it).

4. A second fixture with `<image href="https://example.invalid/icon.png">` must **not** keep that `https:` href after sanitize.

5. Legend: add or extend a .NET test that a render containing both a virtual machine and a load balancer still emits legend labels for categories only (`Compute`, `Network`, …). The legend SVG must not contain `virtual-machine.png` or the text `Virtual Machine`. If the legend already behaves this way, lock it with a test rather than redesigning it.

## Acceptance criteria

- Data-URI PNG icons survive sanitize.
- Remote image URLs do not survive sanitize.
- Legend stays category-level.

## Constraints

- Working-tree safety before editing a tracked file. Exit 2 → skip and report.
- Do not add icons to `archlucid-ui/public`.
- Do not change forest layout code unless a test proves sanitize cannot be fixed in the UI module alone.
- Verification: `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts` and `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLegend|FullyQualifiedName~AzureArchitectureIcon'`. Heartbeat every 8s if a command exceeds 15s. No full-solution build. No dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
