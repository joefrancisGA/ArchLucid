# IDR-02 — Print resource group on inventory-forest cards

**Wave:** inventory-diagram-rg-caption (**IDR**). **Depends on:** IDR-01 merged (or on this branch). **Do not** implement IDR-03 or bounding boxes.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory-forest SVG cards must show the resource group as a **muted line under the wrapped resource name** when `ResourceGroupCaption` is set. Card height grows by that line. Name wrapping stays independent of the RG string. Nodes with no group look as they do today.

## Why

Owner Full subscription screenshot (2026-09-15): four columns of cards, icon + name, no RG. Forest is the live canvas (`LayoutEngine = inventory-forest`). Putting the group on the card is the smallest change that makes membership visible on **that** picture (browser find for `rg-…` highlights members). Tooltip-only (IDR-01) is not enough.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs` — `Measure` builds `NameLines` from `caption.ResourceName` only
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeMetrics.cs` — add group lines; do not jam RG into `NameLines`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — bold `NameLines`; new muted text for group lines
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryNodeCanvasLabelFormatter.cs` — reuse `FormatLines` for long RG names
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` — `LineHeight` (16), `CharacterWidth`; do not change default `UniformNodeWidth`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs` — owner-shape `viewBoxHeight < 800` must still pass; pictogram test nodes have no RG so titles stay name+type
- IDR-01: `DiagramNodeHumanCaption.ResourceGroupCaption`

Do **not** pack or sort by resource group. Connected-component column packing stays.

## What to build

1. `DiagramForestNodeMetrics`: add `IReadOnlyList<string> ResourceGroupLines` (empty list when no group, never null).
2. `DiagramForestCanvasLabelContext.Measure`:
   - Keep `NameLines` from `FormatLines(caption.ResourceName, …)` only.
   - If `caption.ResourceGroupCaption` is non-whitespace, `ResourceGroupLines = FormatLines(that caption, peer names of **resource groups** on this canvas, options)` so two long similar RG names still truncate distinctly. Peer list = distinct non-empty `ArmResourceGroup` / `ResourceGroupCaption` values on the node set used in `Create`. If that requires storing captions at `Create` time, do it in this class (still one class).
   - Height = existing formula **plus** `ResourceGroupLines.Count * options.LineHeight` (and keep existing pictogram/name padding). One extra line ⇒ +16px at default `LineHeight`.
3. `DiagramForestNodeSvgEmitter.Emit`:
   - Draw `NameLines` as today (`font-size` 12, `font-weight` 700, fill `#0f172a`).
   - If `ResourceGroupLines` is non-empty, draw a **separate** `text` element below the name block: `font-size="11"`, `font-weight="400"`, fill `#64748b`, `text-anchor="middle"`, same `x` as the name. Do not use the name's 700 weight.
   - Include group lines in the native `<title>` via `metrics.Caption.AccessibilityTitle` (already updated in IDR-01). Do not invent a second title.
4. Tests in `DiagramForestLayoutSvgRendererTests` (fail on current SVG, pass after):
   - Two nodes, `ArmResourceGroup` `rg-app-prod` and `rg-data-prod`, distinct labels: SVG contains both group strings as text; the group `text` uses `font-weight="400"` and fill `#64748b`.
   - Node with null/empty `ArmResourceGroup`: no extra muted line (no empty `tspan`).
   - `Render_uses_pictograms_and_bold_wrapped_names` still finds the existing `<title>` strings (those nodes have no RG).
   - `Render_owner_shape_executive_vnets_places_eleven_nodes_with_tight_viewbox`: still `viewBoxHeight < 800` (owner-shape VNets typically share no RG stamp in that fixture — if they do, bump the ceiling only with a comment and a still-tight bound, not a blank check).
5. No Graphviz HTML in this prompt. No UI. No compiler flatten/packer edits.

## Acceptance criteria

- A Full subscription / forest render of a node with `ArmResourceGroup` shows that name on the card under the resource name, quieter than the name.
- Same-RG cards may still sit in different columns. That is accepted. Do not “fix” it with frames.
- Extra height is one line per card, not a second pictogram.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** emit `g.subgraph` / cluster rects. **Do not** change `DiagramComponentRowPlanner` / packer. **Do not** restore `alpack_*`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramInventoryNodeCanvasLabelFormatterTests|FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
