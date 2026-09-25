> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagram resource-group frames** honest and visible (per-cell bounds, inside labels, 2 px solid stroke, frame-aware gaps, crop, PNG parity). Internal engineering only. **Do not implement from this file** except by pasting one numbered prompt per chat.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-frames-00-index.md`](../../.cursor/prompts/inventory-diagram-frames-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR / IDA / IDP**. **Do not** retune Mermaid `nodeSpacing`. **Do not** bump global `ComponentHorizontalGap` / `ComponentVerticalGap`. Nested VNet/subnet frames stay **IDA-HOLD / IDF-HOLD in those waves**. Authorized nesting is **IDX-05 / IDX-06**. Boxes from **IDR** chats stay **IDR-HOLD**.

# IDF-01–IDF-07 — Inventory-diagram resource-group frame visibility

**Observed (2026-09-16):** Owner Inventory diagrams screenshot (Executive, ~424-resource snapshot, 61 canvas nodes). Live engine `inventory-forest`. IDA-08 dashed `g.rg-frame` boxes exist but overlap and share corners; 11 px labels overprint; a frame border strikes through the name below; stroke is omitted (1 px) `#94a3b8` `5 4` — the same family as 1.5 px peering dashes; fill 50% `#f1f5f9` matches card `#f8fafc`; Fit in view crops node union only. Owner asked to make the boxes more obvious (space between them, double the line width) and to hear ideas first — **this file is those ideas as runnable prompts**.

**Product framing (locked):** pack remains IDA-08 (per connected component). Frames become **one box per packed cell**. Labels **inside**. Ink is **2 px solid `#64748b`** on an opaque `#f1f5f9` plate. Space is **cell chrome**, not a global gap bump. Crop includes `g.rg-frame`. PNG clusters match packing + ink.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| One AABB per RG **name** overlaps islands | **IDF-01** | IDF-03 paints a louder lie |
| Label 4 px outside in a 16 px gutter | **IDF-02** | Names still overprint after thicker stroke |
| 1 px `#94a3b8` dash `5 4` = peering wire | **IDF-03** | Doubled dash still reads as an edge |
| 12 px pad stolen from 40/48 px gaps | **IDF-04** | Boxes still kiss; owner “space” missing |
| Crop = `g.node` + 12 px | **IDF-05** | 2 px stroke and labels clip |
| PNG has no clusters (IDA-08 §6) | **IDF-06** | Canvas honest, download a liar |
| Count-frames-only tests | **IDF-07** | Name-union / `5 4` return |
| Nested frames / global gap bump / IDR boxes | **IDF-HOLD** | IDA/IDR/IDG regressions |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDF-01** Per-cell frame bounds + AABB tests | First | trunk (IDA-08 frames already on forest) |
| **IDF-02** Label inside + top band | After 01 | Disjoint frames |
| **IDF-03** Stroke 2 / solid / opaque fill / legend row | After 02 | Label position stable |
| **IDF-04** Frame-aware cell chrome | After 02 (prefer after 03) | Named pad + label band |
| **IDF-05** Crop includes frames | After 02 | Labels inside |
| **IDF-06** Graphviz PNG cluster parity | After 03 | Style constants; packing = forest |
| **IDF-07** Ratchet | Last | 01–06 |
| **IDF-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-frames-<short-name>-idf1`). Name the branch in any commit/push request.

**IDF-01 before IDF-03.** Doubling stroke on overlapping boxes makes the current canvas worse.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- **Do not** retune Mermaid `nodeSpacing` / `rankSpacing` / `padding`. **Do not** raise `ComponentHorizontalGap` / `ComponentVerticalGap`. **Do not** default Graphviz `dot`.

### Locked facts (do not re-diagnose)

- Live Full/Executive canvas is **inventory-forest** (`layoutSvg`) when present. Mermaid is Export / fail-soft. Graphviz `fdp` is inventory **PNG**.
- `PartitionCells` packs by `ArmResourceGroup` **inside one connected component**. `ResolveFrameBounds` then unions by **name** across the canvas — that is the overlap.
- IDA-08 required AABB non-overlap (0.5 px). No `DiagramResourceGroupPackerTests.cs` exists.
- Frame emitter omits `stroke-width` (1 px default), `stroke="#94a3b8"`, `stroke-dasharray="5 4"`, `fill-opacity="0.5"`, label at `y - 4`.
- Peering: 1.5 px `#94a3b8` `6 4`. Declared (IDP-02): `4 3`. Frames must not reuse either.
- `queryInventoryDiagramNodeElements` is `g.node` only; crop `paddingPx` 12.
- Executive flatten often removes RG `ast.Subgraphs`; PNG clusters must pack from `ArmResourceGroup`, not leftover swimlanes.
- Singleton RGs keep the IDR card line and get no frame.

### Locked visual language (IDF-03)

| Property | IDA-08 today | After IDF-03 |
|----------|----------------|--------------|
| `stroke-width` | omitted (1 px) | **2** |
| `stroke` | `#94a3b8` | **`#64748b`** |
| dash | `5 4` | **none (solid)** |
| `fill` | `#f1f5f9` | `#f1f5f9` |
| `fill-opacity` | `0.5` | **`1`** |
| `rx` | `8` | `8` |
| Label | 11 px, 4 px above | **12 px semibold, inside**, white halo (IDF-02) |

---

# IDF-01 — Frame per packed cell, not per resource-group name

**Depends on:** trunk (IDA-08) · **Branch:** `cursor/inventory-diagram-frames-per-cell-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-01-per-cell-bounds.md`](../../.cursor/prompts/inventory-diagram-frames-01-per-cell-bounds.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: each packed resource-group cell gets its own g.rg-frame. Same ArmResourceGroup in two disconnected components → two non-overlapping frames. Add DiagramResourceGroupPackerTests with AABB overlap (0.5 px). Do not change stroke, dash, fill, labels, crop, or Graphviz.

Locked diagnosis: PartitionCells packs per component; ResolveFrameBounds unions all placements by name. IDA-08 AABB test was never written.

This is NOT IDF-02–07. No stroke-width. No global gap bump. No nested VNet boxes.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-01-per-cell-bounds.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'
```

---

# IDF-02 — Resource-group label inside the frame

**Depends on:** IDF-01 · **Branch:** `cursor/inventory-diagram-frames-label-inside-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-02-label-inside.md`](../../.cursor/prompts/inventory-diagram-frames-02-label-inside.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: RG frame labels sit inside the box at top-left, 12 px semibold, white halo like edge-label pills. Reserve a top label band so names do not sit on cards. Do not change stroke-width, dash, or fill-opacity.

Locked diagnosis: label is y = frame.Y - 4 in a 16 px vertical gutter. Owner screenshot: overprinted names and a border through anly-aep-ppd-hi.

This is NOT IDF-03 stroke. NOT IDF-04 global gaps. NOT crop.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-02-label-inside.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'
```

---

# IDF-03 — Obvious frame stroke and plate

**Depends on:** IDF-02 · **Branch:** `cursor/inventory-diagram-frames-stroke-fill-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-03-stroke-and-fill.md`](../../.cursor/prompts/inventory-diagram-frames-03-stroke-and-fill.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: g.rg-frame rect is stroke-width 2, solid #64748b, fill #f1f5f9 fill-opacity 1. Legend row "Resource group" when any frame exists. Do not restyle peering (6 4) or declared (4 3) edges. Do not restore 5 4.

Owner asked to double the line width. Solid + darker stroke is what makes that read as a container rather than a thicker peering chord.

This is NOT IDF-04 cell chrome, NOT Graphviz clusters.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-03-stroke-and-fill.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs
- ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestResourceGroupFrame|FullyQualifiedName~DiagramForestLegend|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'
```

---

# IDF-04 — Frame-aware cell chrome (space between boxes)

**Depends on:** IDF-02 (prefer IDF-03) · **Branch:** `cursor/inventory-diagram-frames-cell-chrome-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-04-frame-aware-gap.md`](../../.cursor/prompts/inventory-diagram-frames-04-frame-aware-gap.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: ComponentHorizontalGap 48 and ComponentVerticalGap 40 are gutters between frame borders, not between node cards. Charge ResourceGroupFramePad and label band to framed cells only. Do not raise those global constants. Do not retune Mermaid nodeSpacing.

Locked diagnosis: 12 px post-placement inflate leaves 16 px vertical between borders.

This is NOT crop, NOT Graphviz.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-04-frame-aware-gap.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'
```

---

# IDF-05 — Viewport crop includes resource-group frames

**Depends on:** IDF-02 · **Branch:** `cursor/inventory-diagram-frames-crop-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-05-crop-includes-frames.md`](../../.cursor/prompts/inventory-diagram-frames-05-crop-includes-frames.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory Fit in view / ink crop unions g.rg-frame as well as g.node. Keep paddingPx 12 around the combined union. Do not include edge paths. Do not revert IDH-02 100% on graphs that fit.

Locked diagnosis: queryInventoryDiagramNodeElements is g.node only; crop 12 px equals IDA-08 pad so frames clip.

This is NOT Graphviz. NOT a Mermaid gap pass.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-05-crop-includes-frames.md
- archlucid-ui/src/lib/help/help-mermaid.ts
- archlucid-ui/src/lib/help/help-mermaid.test.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts
```

---

# IDF-06 — Graphviz PNG resource-group cluster parity

**Depends on:** IDF-03 · **Branch:** `cursor/inventory-diagram-frames-png-clusters-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-06-graphviz-png-parity.md`](../../.cursor/prompts/inventory-diagram-frames-06-graphviz-png-parity.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Export PNG DOT emits subgraph cluster_ per packed RG cell (same IDF-01 split-component rule), penwidth 2, solid #64748b, fillcolor #f1f5f9. Live canvas stays inventory-forest. Do not emit alpack clusters. Do not default layout engine dot.

Locked diagnosis: IDA-08 left Graphviz out of scope; Executive flatten removes ast.Subgraphs so leftover swimlanes cannot be the source of truth.

This is NOT nested VNet clusters. NOT a live Graphviz canvas.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-06-graphviz-png-parity.md
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphvizDotEmitterTests|FullyQualifiedName~DiagramResourceGroupPacker'
```

---

# IDF-07 — Resource-group frame visibility ratchet

**Depends on:** IDF-01–06 · **Branch:** `cursor/inventory-diagram-frames-ratchet-idf1`

**Paste file:** [`.cursor/prompts/inventory-diagram-frames-07-visibility-ratchet.md`](../../.cursor/prompts/inventory-diagram-frames-07-visibility-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: tests fail if RG frames regress to name-wide overlapping AABBs, 1 px #94a3b8 5 4 strokes, labels outside the rect, node-only crop, or PNG without cluster_ for a two-node RG. Do not implement new visuals.

This is NOT IDF-HOLD. Do not retune Mermaid gaps to make Playwright pass.

Read first:
- .cursor/prompts/inventory-diagram-frames-00-index.md
- .cursor/prompts/inventory-diagram-frames-07-visibility-ratchet.md
- ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs
- archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests: as named in the paste file (dotnet filter + vitest + MOCK_E2E_SKIP_NEXT_BUILD playwright layout project).
```

---

# IDF-HOLD — No nested frames, no global gap bump, no IDR boxes

**This is not implementation.** Paste [`.cursor/prompts/inventory-diagram-frames-08-hold.md`](../../.cursor/prompts/inventory-diagram-frames-08-hold.md) only if a session starts nested Azure boxes, a global gap bump, RG frames from an **IDR** chat, restoring `5 4` / peering `6 4` on frames, Microsoft icons, Graphviz `dot` as live canvas, or merging disconnected components so one RG is a single island.

## Follow-on (not this wave)

Nested subscription → RG → VNet → subnet frames stay **IDA-HOLD / IDF-HOLD** when started from those waves. Authorized nesting is **IDX-05 / IDX-06** ([`INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md)). Merging disconnected components into one RG island is a later layout engine, not IDF-01.
