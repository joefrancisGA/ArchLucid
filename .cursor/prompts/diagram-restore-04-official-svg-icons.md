# DRS-04 — Official Azure SVG icons

**Wave:** Diagram restore (**DRS**). **Depends on:** DRS-03 looked at and accepted, or the owner explicitly skipping DRS-03. **Blocked** until the official zip is in the tree.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Mapped Azure resource types draw the official Architecture Center icon. Unmapped types keep the category pictogram. Icons stay sharp when the owner zooms in. Product names stay on the card, next to the mark.

## Why

#3585 and #3586 used 18×18 PNGs. Those are not the pack the owner accepted, and they pixelate as soon as the card is larger than the bitmap. The accepted pack is the SVG zip from Microsoft’s Azure Architecture Center page, July 2026 vintage. See `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`.

## Stop if the zip is missing

Look for a zip the owner placed under:

`ArchLucid.ArtifactSynthesis/Assets/AzureIcons/source/`

If that folder has no zip, **stop**. Do not download icons. Do not clone a GitHub icon mirror. Do not restore `*.png` from `1460498a65` or `f49c801263`. Report that DRS-04 is waiting on the owner.

## Context

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- Reference for the catalog shape only (do not restore its PNG embedding): `git show f49c801263:ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs`
- Reference for ARM **kind** so Function App is not drawn as App Service: `git show bfc0ca30e7 -- ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- Client sanitizer: `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts`

## What to build

1. Branch `drs/04-official-svg-icons` from the accepted DRS-03 branch, or from `revert/diagram-icon-layout-3585-3592` if earlier slices were skipped.
2. Read the owner’s zip. Map ARM types that have an official SVG. One manifest entry per file: category, service name, ARM types, optional kind, file name.
3. Embed the SVG. Do not rasterize to PNG. Draw it in the existing pictogram slot with `preserveAspectRatio="xMidYMid meet"`. Do not crop, flip, rotate, or recolor the mark.
4. When the catalog returns null, emit the existing category pictogram.
5. Sanitize: allow the embedded SVG, strip `script`. Reject `https:` and any other remote `href`. Do not allow `data:image/png`.
6. Keep the resource name on the card. Do not use an Azure icon to represent ArchLucid.
7. Do not change subscription-frame rules, data-flow placement, or outline structure.

## Acceptance criteria

- A virtual machine node contains the official SVG and does not contain `class="pictogram"`.
- An unmapped type still contains `class="pictogram"` and no Azure icon.
- `Microsoft.Web/sites` with kind `functionapp` resolves to the Function App SVG, not the App Service SVG.
- Rendered SVG has no `data:image/png` and no `https://` image href.
- A network inventory fixture still contains `class="subscription-frame"`.

## Constraints

- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**
- Microsoft’s terms: architectural diagrams only, product name near the icon, icon as it appears in Azure.

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj
npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts
```

Heartbeat every 8s on the compile.

## Done when

Tests pass, or you stopped because the zip was absent. If tests passed, tell the owner to restart the API and look at one mapped card (virtual machine or storage) and one unmapped card, at the normal fit and zoomed in. The mark should stay sharp. Wait for that look before any commit.
