# IDR-03 — Graphviz HTML labels include the resource group (PNG parity)

**Wave:** inventory-diagram-rg-caption (**IDR**). **Depends on:** IDR-01. May parallel IDR-02. **Do not** implement bounding boxes or IDR-02 forest SVG here.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`DiagramGraphvizHtmlNodeLabel.Format` must add the resource group as a third HTML line when `ResourceGroupCaption` is set, matching the forest card (name, type, group). Inventory **Download PNG** for `inventory-forest` still runs `fdp -Tpng` from AST labels — without this, the canvas (IDR-02) shows the RG and the PNG does not.

## Why

`InfraEvidenceSnapshotMermaidService.TryRenderInventoryPngAsync`: when `LayoutEngine` is `inventory-forest` **or** `graphviz-fdp`, PNG is Graphviz, not the forest SVG. IDR-02 alone would make the workbench honest and the PNG a liar.

## Context

- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramGraphvizHtmlNodeLabel.cs` — today `<B>name</B><BR/>(type)`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs` — IDR-01 `ResourceGroupCaption`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramGraphvizHtmlNodeLabelTests.cs` — existing fact has **no** `ArmResourceGroup`; it must stay `<<B>vm-app</B><BR/>(Virtual machine)>`
- Do not change DOT structure, `fdp` flags, or forest SVG in this prompt.

## What to build

1. After the optional type line, if `caption.ResourceGroupCaption` is non-whitespace, append `<BR/>` + escaped group name (not wrapped in parentheses; type stays in `(…)`).
   - Example: `<<B>vm-app</B><BR/>(Virtual machine)<BR/>rg-app-prod>`
2. Escape the group with the existing `Escape` helper (same `&` `<` `>` rules).
3. If type is missing but RG is present: `<B>name</B><BR/>rg-app-prod` (no empty `()` line).
4. Tests in `DiagramGraphvizHtmlNodeLabelTests`:
   - Existing `Format_uses_html_bold_name_and_type_line` unchanged.
   - New: VM + `ArmResourceGroup = "rg-app-prod"` → exact HTML string above.
   - New: name only + RG, no type → name + BR + rg, no `()`.
   - New: `ArmResourceGroup` whitespace → same as no RG.
5. No UI. No OpenAPI. No packer. No new Graphviz clusters.

## Acceptance criteria

- Graphviz HTML for a node with a resource group includes that group as its own line.
- Nodes without a group keep today’s two-line (or one-line) HTML.
- Forest SVG is out of scope here; if IDR-02 is not merged yet, do not implement it “while you are here.”

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** switch inventory PNG to forest SVG in this prompt (that is a different slice). **Do not** add `cluster_` RG frames to DOT.
- C#: concrete types over `var`, blank line before `if` / `foreach` unless first in method, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramGraphvizHtmlNodeLabelTests|FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
