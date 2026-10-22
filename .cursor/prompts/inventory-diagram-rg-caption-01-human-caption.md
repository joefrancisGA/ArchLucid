# IDR-01 — Put resource group on the inventory node caption

**Wave:** inventory-diagram-rg-caption (**IDR**). **Depends on:** none (backend-only). **Do not** implement IDR-02, IDR-03, or bounding boxes.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`DiagramNodeHumanCaption` must carry an optional resource-group string sourced from `DiagramNode.ArmResourceGroup`. The SVG accessibility `<title>` (and any other `AccessibilityTitle` consumer) must include that group when present. **CombinedPlainText stays name + type** so existing name/type tests and Graphviz bold-name lines do not grow a third clause in this prompt.

## Why

Owner Full subscription forest (2026-09-15): cards show icon + name. Inventory already has `ArmResourceGroup`. The caption factory is the single place forest SVG titles and (in IDR-03) Graphviz HTML should read. Without this field, IDR-02 will duplicate trim/empty logic.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaption.cs` — add a property; keep it a record
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs` — `ArmResourceGroup` already exists; do not change the AST
- `ArchLucid.ArtifactSynthesis.Tests/DiagramNodeHumanCaptionFactoryTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs` — `Render_uses_pictograms_and_bold_wrapped_names` uses nodes **without** `ArmResourceGroup`; those `<title>` assertions must still pass

## What to build

1. `DiagramNodeHumanCaption`: add `string? ResourceGroupCaption`. Positional record — update every construction site in this assembly (factory only, unless tests construct it).
2. `DiagramNodeHumanCaptionFactory.Create`:
   - After existing name/type logic, set `ResourceGroupCaption` to trimmed `node.ArmResourceGroup` when non-whitespace; otherwise `null`.
   - `CombinedPlainText` remains `{resourceName}` or `{resourceName} ({typeCaption})` — **no RG**.
   - `AccessibilityTitle`: when `ResourceGroupCaption` is non-null, `{combined} · {ResourceGroupCaption}`; otherwise same as today (`combined`).
   - Do not prefix `RG ` unless the stored ARM name already includes it. Print the inventory group name as stored (e.g. `rg-app-prod`).
3. Tests (fail on current factory, pass after) in `DiagramNodeHumanCaptionFactoryTests`:
   - Node with `ArmResourceGroup = "rg-app-prod"` and a VM type: `ResourceGroupCaption` is `rg-app-prod`; `CombinedPlainText` still `vm-app (Virtual machine)`; `AccessibilityTitle` is `vm-app (Virtual machine) · rg-app-prod`.
   - Whitespace / null / empty `ArmResourceGroup`: `ResourceGroupCaption` is null; title has no ` · `.
   - Existing two facts stay green (no RG on those nodes).
4. No forest emitter changes. No Graphviz HTML changes. No UI. No OpenAPI.

## Acceptance criteria

- A diagram node with `ArmResourceGroup` set exposes that string on the caption and in `AccessibilityTitle`.
- Nodes without a group are unchanged.
- `CombinedPlainText` does not include the resource group.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** draw bounding boxes. **Do not** change forest packing. **Do not** flatten or unflatten subgraphs. **Do not** edit `DiagramForestNodeSvgEmitter` in this prompt (IDR-02).
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
