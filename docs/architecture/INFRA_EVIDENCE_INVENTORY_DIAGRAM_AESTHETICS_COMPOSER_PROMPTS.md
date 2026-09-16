> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams** look like a human architecture sketch (neutral cards, category cues, elbows, RG frames, legend, canvas-first page). Internal engineering only. **Do not implement from this file** except by pasting one numbered prompt per chat.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-aesthetics-00-index.md`](../../.cursor/prompts/inventory-diagram-aesthetics-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR**. **Do not** retune Mermaid `nodeSpacing`. **Do not** ship Microsoft Azure product icons. RG frames are **IDA-08**, not an IDR chat.

# IDA-01–IDA-12 — Inventory-diagram aesthetics

**Observed (2026-09-15):** Owner Inventory diagrams screenshot (Executive / Full subscription forest). Live engine `inventory-forest`. Uniform honey `#D4A84B` 400 px cards; RG captions `#64748b` on gold (~2.1:1); peering chords through nodes with stacked “peering” pills; no containers; Nodes/Edges tables taller than the canvas; no legend.

**Product framing (locked):** Carbon-like **neutral cards**, category as a **4 px accent** + original pictograms, **elbows**, **pack-then-frame** resource groups, SVG **legend**, **collapsed** outline, Fit in view **only on overflow**. Layout waves already made the graph fit (IDH/IDG). This wave makes humans like looking at it.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Honey wall; caption contrast | **IDA-01** | Accents paint gold/white; PNG stays “warning” |
| Type invisible | **IDA-02** | Still a monochrome card dump |
| Paint/Graphviz/PNG diverge | **IDA-03** | Canvas honest, download a liar; pictograms clobbered |
| 400 px empty cards | **IDA-04** | Horizontal scrollbar; icon-above-text |
| Lines through nodes | **IDA-05** | Elbows never happen |
| Stacked peering pills | **IDA-06** | Six labels on one pixel |
| High-degree TD stack | **IDA-07** | Hub hidden in a column |
| RG only as repeated captions | **IDA-08** | Full subscription still a flat dump |
| No key | **IDA-09** | Dashes/accents unexplained on PNG |
| Tables taller than canvas | **IDA-10** | Diagram is not the hero |
| Overflow at locked 100% | **IDA-11** | Dual scrollbars on large forests |
| No ratchet | **IDA-12** | Next agent restores honey/400 px |
| Icons / nested frames / gap retune | **IDA-HOLD** | License + IDG/IDR regressions |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDA-01** Neutral palette + caption contrast | First | trunk (IDR captions already on forest) |
| **IDA-02** Category accent bar | After 01 | IDA-01 `node-card` + pictogram paint skip |
| **IDA-03** Paint / Graphviz / CLI / PNG parity | After 02 | IDA-01 + IDA-02 |
| **IDA-04** Content-sized icon-left cards | After 03 | Palette stable |
| **IDA-05** Orthogonal edges + markers | After 04 | New box sizes |
| **IDA-06** Edge-label collapse + peering dash | After 05 | Elbows |
| **IDA-07** Hub-and-spoke | After 04; parallel with 05–06 if no emitter overlap | IDA-04 |
| **IDA-08** RG pack + dashed frames | After 04 | Content-sized cards |
| **IDA-09** SVG legend | After 02 + 06 | Kinds + dashes |
| **IDA-10** Outline collapse | Parallel with 01–09 | none (UI) |
| **IDA-11** Overflow camera | After 04 | Sizes change overflow; **do not** revert IDH-02 |
| **IDA-12** Ratchet | Last | 01–11 |
| **IDA-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-aesthetics-<short-name>-ida1`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- **Do not** retune Mermaid `nodeSpacing` / `rankSpacing` / `padding`. **Do not** default Graphviz `dot`. **Do not** add elk / React Flow for inventory.

### Locked facts (do not re-diagnose)

- Live Full/Executive canvas is **inventory-forest** (`layoutSvg`) when present. Mermaid is Export / fail-soft. Graphviz HTML is inventory **PNG**.
- Honey lives in `ArchitectureDiagramMermaidPalette` **and** `architecture-diagram-mermaid-config.ts` **and** `paintArchitectureDiagramNodePalette` (every `g.node rect|circle`).
- `paintArchitectureDiagramNodePalette` currently recolors **pictograms**. IDA-01 must exclude `g.pictogram` or icons go white with the new fill.
- Uniform **400 px** is asserted in `DiagramForestLayoutSvgRendererTests.Render_owner_shape_executive_vnets_use_uniform_node_width` — rewrite it in IDA-04; do not keep 400.
- RG frames on the **current** connected-component grid overlap (**IDR-HOLD**). IDA-08 packs by `ArmResourceGroup` **first**. Singleton RGs keep the IDR caption and get no frame.
- IDH-02 **100% on source change** stays for graphs that **fit**. IDA-11 Fit in view is **overflow only**.
- Pictograms are original artwork, not Microsoft Azure icons.

---

# IDA-01 — Neutral card palette and readable captions

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-aesthetics-neutral-palette-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-01-neutral-palette.md`](../../.cursor/prompts/inventory-diagram-aesthetics-01-neutral-palette.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: retire honey #D4A84B as inventory node fill. Light cards #f8fafc / border #cbd5e1 / caption #475569 / rx 6. Client paint must not recolor g.pictogram. Keep C# ArchitectureDiagramMermaidPalette in sync with architecture-diagram-mermaid-config.ts.

Owner 2026-09-15 forest: honey wall, unreadable RG captions. This is palette + contrast only — no accent bars, no 160–280 widths, no edges.

This is NOT IDA-02–12, not Microsoft icons, not a Mermaid gap pass.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-01-neutral-palette.md
- ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs
- archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs
- archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~ArchitectureDiagramMermaidCliConfigWriterTests'
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/lib/architecture/architecture-diagram-mermaid-config.test.ts
```

---

# IDA-02 — Category accent bar on forest cards

**Depends on:** IDA-01 · **Branch:** `cursor/inventory-diagram-aesthetics-category-accent-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-02-category-accent.md`](../../.cursor/prompts/inventory-diagram-aesthetics-02-category-accent.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: 4 px left accent on forest node-card using existing pictogram-kind colors (shared FillFor helper). Paint skips rect.node-accent. Do not fill the whole card by kind.

This is NOT Graphviz HTML (IDA-03), not content-sized cards, not Microsoft icons.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-02-category-accent.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramSvgEmitter.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramInventoryPictogram'
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts
```

---

# IDA-03 — Mermaid, Graphviz, and PNG parity

**Depends on:** IDA-01 + IDA-02 · **Branch:** `cursor/inventory-diagram-aesthetics-paint-parity-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-03-paint-parity.md`](../../.cursor/prompts/inventory-diagram-aesthetics-03-paint-parity.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Graphviz DOT/PNG and CLI Mermaid match IDA-01 neutrals. Graphviz HTML gets a kind-color side cell (FillFor + pictogram kind resolver). htmlLabels stays false. Paint allow-lists node-card / Mermaid body rects only.

This is NOT card geometry, edges, or legend.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-03-paint-parity.md
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramGraphvizHtmlNodeLabel.cs
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs
- archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramGraphvizHtmlNodeLabelTests|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~ArchitectureDiagramMermaidCliConfigWriterTests'
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts
```

---

# IDA-04 — Content-sized cards, icon left

**Depends on:** IDA-03 · **Branch:** `cursor/inventory-diagram-aesthetics-content-sized-cards-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-04-content-sized-cards.md`](../../.cursor/prompts/inventory-diagram-aesthetics-04-content-sized-cards.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: forest cards min 160 / max 280 px, pictogram left, name+RG start-anchored on the right. Rewrite the owner-shape test that requires width 400. Do not retune Mermaid nodeSpacing/rankSpacing/padding. wrappingWidth 280 only if needed to match max width.

This is NOT orthogonal edges or RG frames.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-04-content-sized-cards.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestCanvasLabelContext|FullyQualifiedName~DiagramForestNode'
```

---

# IDA-05 — Orthogonal edges and directed markers

**Depends on:** IDA-04 · **Branch:** `cursor/inventory-diagram-aesthetics-orthogonal-edges-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-05-orthogonal-edges.md`](../../.cursor/prompts/inventory-diagram-aesthetics-05-orthogonal-edges.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: forest visible edges are orthogonal SVG paths that do not run through a third node rect. Directed non-peering edges get marker-end. Peering has no arrow. Stroke LightEdgeStroke #94a3b8. No elk/React Flow.

This is NOT label collapse (keep one pill per edge) or hub-spoke.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-05-orthogonal-edges.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestOrthogonalEdgeRouter|FullyQualifiedName~DiagramForestEdge'
```

---

# IDA-06 — Collapse duplicate edge labels; dash peering

**Depends on:** IDA-05 · **Branch:** `cursor/inventory-diagram-aesthetics-edge-label-collapse-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-06-edge-label-collapse.md`](../../.cursor/prompts/inventory-diagram-aesthetics-06-edge-label-collapse.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: if every visible edge in a component shares one label (owner six peering), draw zero on-path pills and dash those paths. Mixed labels keep pills, offset so centers are ≥12 px apart. Edge <title> still names the relationship. Do not drop arrows.

This is NOT the SVG legend (IDA-09).

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-06-edge-label-collapse.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestEdgeLabel|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestEdgeLabelCollapse'
```

---

# IDA-07 — Hub-and-spoke placement

**Depends on:** IDA-04 · **Branch:** `cursor/inventory-diagram-aesthetics-hub-spoke-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-07-hub-spoke-placement.md`](../../.cursor/prompts/inventory-diagram-aesthetics-07-hub-spoke-placement.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: visible undirected degree ≥ 3 → hub on the right, spokes in one left column, hub vertically centered on the spoke stack. Pairs/triples stay TD. Max-degree-2 chains stay existing LR layers. No alpack subgraphs. No new visible edges.

May parallel IDA-05/06 if you only touch the planner + forest interior layout, not edge SVG emitters.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-07-hub-spoke-placement.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramLeftToRightLayerPlanner.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramLeftToRightLayerPlannerTests|FullyQualifiedName~DiagramHubSpokeLayerPlanner|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'
```

---

# IDA-08 — Pack by resource group and dashed frames

**Depends on:** IDA-04 · **Branch:** `cursor/inventory-diagram-aesthetics-rg-containers-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-08-rg-containers.md`](../../.cursor/prompts/inventory-diagram-aesthetics-08-rg-containers.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: this is the IDR-HOLD follow-on. Pack forest nodes by ArmResourceGroup when count ≥ 2, then draw a dashed labeled frame. Drop IDR-02 RG lines on those cards. Singletons keep the caption and get no frame. Do not overlap frames. Do not nest VNet/subnet boxes. Do not undo FlattenSparseSubgraphs. Do not add Graphviz clusters.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-08-rg-containers.md
- .cursor/prompts/inventory-diagram-rg-caption-04-hold.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'
```

---

# IDA-09 — SVG legend

**Depends on:** IDA-02 + IDA-06 · **Branch:** `cursor/inventory-diagram-aesthetics-svg-legend-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-09-svg-legend.md`](../../.cursor/prompts/inventory-diagram-aesthetics-09-svg-legend.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: forest SVG g.legend lists used pictogram kinds, PE lock if present, solid Connector vs dashed Peering. Place so AABB does not intersect g.node. Survives PNG because it is SVG, not HTML overlay. Omit unused kinds. No Microsoft icons. No foreignObject.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-09-svg-legend.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLegend|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'
```

---

# IDA-10 — Collapse Nodes and Edges tables

**Depends on:** none (UI) · **Branch:** `cursor/inventory-diagram-aesthetics-outline-collapse-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-10-outline-tables-collapse.md`](../../.cursor/prompts/inventory-diagram-aesthetics-10-outline-tables-collapse.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: InfraEvidenceDiagramOutline Nodes/Edges collapsed by default with counts in the disclosure label. Workbench canvas outline collapsed; dependency seed nodes open; too-large-for-browser outline open. No ghost/link Button. Do not hide desktop review workspace tabs. Optional camera max-h-[42rem] only from DiagramsWorkbenchClient.

This is NOT IDA-11 camera fit.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-10-outline-tables-collapse.md
- archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx
```

---

# IDA-11 — Fit in view only when ink overflows

**Depends on:** IDA-04 · **Branch:** `cursor/inventory-diagram-aesthetics-overflow-camera-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-11-large-graph-camera.md`](../../.cursor/prompts/inventory-diagram-aesthetics-11-large-graph-camera.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: if mapped ink fits the viewport at 100%, stay 100% (IDH-02). If it overflows, default to Fit in view contain, never scale above 100%. Do not use unmapped getBBox. Do not revert source-change zoom reset for small plates (owner 11/6 stays 100%).

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-11-large-graph-camera.md
- .cursor/prompts/inventory-diagram-human-02-viewer-zoom-and-camera.md
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx
- archlucid-ui/src/lib/help/help-mermaid.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx src/lib/help/help-mermaid.test.ts src/lib/architecture/architecture-diagram-zoom.test.ts
```

---

# IDA-12 — Aesthetics ratchet

**Depends on:** IDA-01–11 · **Branch:** `cursor/inventory-diagram-aesthetics-visual-ratchet-ida1`

**Paste file:** [`.cursor/prompts/inventory-diagram-aesthetics-12-visual-ratchet.md`](../../.cursor/prompts/inventory-diagram-aesthetics-12-visual-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: tests fail if honey node fills, 400 px uniform cards, always-open workbench outline, or (when those slices landed) stacked peering pills / straight third-node chords return. Extend chromium-infra-diagrams-layout; do not resurrect unmapped bbox IDS-04. No new visuals.

Read first:
- .cursor/prompts/inventory-diagram-aesthetics-00-index.md
- .cursor/prompts/inventory-diagram-aesthetics-12-visual-ratchet.md
- ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs
- archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests: as named in the paste file (dotnet filter + vitest + MOCK_E2E_SKIP_NEXT_BUILD playwright layout project).
```

---

# IDA-HOLD — No Microsoft icons, no nested frames, no gap retune

**This is not implementation.** Paste [`.cursor/prompts/inventory-diagram-aesthetics-13-hold.md`](../../.cursor/prompts/inventory-diagram-aesthetics-13-hold.md) only if a session starts Azure product icons, nested VNet/subnet frames, RG boxes on the unclustered grid, FlattenSparse rewind, `alpack_*`, Mermaid gap retune, Graphviz `dot` default, elk/React Flow inventory, or honey fill as “brand.”

## Follow-on (not this wave)

Microsoft architecture-icon licensing (owner decision). Nested VNet→subnet frames stay **IDA-HOLD**. **IDA-08 frames that overlap / read as peering wires** are **IDF-01–IDF-07** ([`INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md)) — do not start IDF from an IDA chat. DAU walkthrough stays DAU.

## Open questions for the owner (defaults apply if unanswered)

1. **Icons.** Default: original pictograms + accent bars. Official Azure icons only after a written license path. OK?
2. **Hub side.** Default: spokes left, hub right (owner screenshot). OK?
3. **Outline.** Default: Nodes/Edges collapsed on the workbench; seed picker open. OK?
