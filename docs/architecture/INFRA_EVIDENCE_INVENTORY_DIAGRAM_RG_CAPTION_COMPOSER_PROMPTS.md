> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that print each Azure **resource group** on inventory-forest cards. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-rg-caption-00-index.md`](../../.cursor/prompts/inventory-diagram-rg-caption-00-index.md) (one numbered file per session).
>
> **Do not** implement resource-group bounding boxes, RG-aware packing, nested VNet frames, or Graphviz-primary Full subscription from this set. **Do not** re-run **IDL / IDS / IDT / IDH / IDG**.

# IDR-01–IDR-03 — Inventory-forest resource-group captions

**Observed (2026-09-15):** Owner Full subscription inventory diagram. Inventory-forest canvas: four columns of individual resource cards (icon + name). No resource-group bounding boxes. No resource-group text on the cards. Nodes outline already has a **Resource group** column. AST already stamps `ArmResourceGroup`. Live layout is `DiagramForestLayoutSvgRenderer` (connected-component grid), which does not paint RG subgraphs.

**Product framing (locked):** print the group name on each card. Do not enclose resources in boxes in this wave.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Caption/tooltip omit `ArmResourceGroup` | **IDR-01** | IDR-02 duplicates trim logic; titles stay name+type |
| Forest cards are icon + name only | **IDR-02** | Owner screenshot unchanged |
| Download PNG uses Graphviz HTML without RG | **IDR-03** | Canvas honest, PNG a liar |
| Bounding boxes / pack-by-RG / flatten rewind | **IDR-HOLD** | Overlapping frames or empty-box regression |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|----------|------------|
| **IDR-01** Caption `ResourceGroupCaption` + `AccessibilityTitle` | First | trunk |
| **IDR-02** Forest muted RG line | After 01 | IDR-01 |
| **IDR-03** Graphviz HTML third line | After 01; parallel with 02 | IDR-01 |
| **IDR-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-rg-caption-<short-name>-c9e4`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Forest is the live Full subscription canvas, not Mermaid dagre, when `layoutSvg` is present.
- `ArmResourceGroup` is already on `DiagramNode`. The gap is rendering, not collection.
- Boxes on the **current** grid would overlap because packing is by connected component.
- PNG for inventory-forest still uses Graphviz HTML labels (`TryRenderInventoryPngAsync`).
- Sparse flatten (threshold 8) on Executive / Network / Data / Identity is intentional. Do not undo it to “show subgraphs.”

---

# IDR-01 — Put resource group on the inventory node caption

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-rg-caption-human-caption-c9e4`

**Paste file:** [`.cursor/prompts/inventory-diagram-rg-caption-01-human-caption.md`](../../.cursor/prompts/inventory-diagram-rg-caption-01-human-caption.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramNodeHumanCaption carries optional ResourceGroupCaption from DiagramNode.ArmResourceGroup. AccessibilityTitle includes " · {rg}" when set. CombinedPlainText stays name + type only.

Owner 2026-09-15 Full subscription forest: cards have no RG text. This prompt is caption only — do not draw forest lines or Graphviz HTML.

This is NOT bounding boxes, RG packing, flatten, IDR-02, or IDR-03.

Read first:
- .cursor/prompts/inventory-diagram-rg-caption-00-index.md
- .cursor/prompts/inventory-diagram-rg-caption-01-human-caption.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaption.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramNodeHumanCaptionFactoryTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'
```

---

# IDR-02 — Print resource group on inventory-forest cards

**Depends on:** IDR-01 · **Branch:** `cursor/inventory-diagram-rg-caption-forest-card-c9e4`

**Paste file:** [`.cursor/prompts/inventory-diagram-rg-caption-02-forest-card-line.md`](../../.cursor/prompts/inventory-diagram-rg-caption-02-forest-card-line.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory-forest SVG cards show ArmResourceGroup as a muted 11px line under the wrapped resource name. Height grows by LineHeight per group line. Do not jam RG into NameLines. Do not pack or sort by RG. Do not draw cluster rects.

Locked owner shape: 2026-09-15 four-column Full subscription forest with no RG on cards. Browser find for an RG name should hit card text after this prompt.

This is NOT IDR-03 Graphviz HTML, NOT bounding boxes, NOT flatten rewind.

Read first:
- .cursor/prompts/inventory-diagram-rg-caption-00-index.md
- .cursor/prompts/inventory-diagram-rg-caption-02-forest-card-line.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramInventoryNodeCanvasLabelFormatterTests|FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'
```

---

# IDR-03 — Graphviz HTML labels include the resource group (PNG parity)

**Depends on:** IDR-01 · **Branch:** `cursor/inventory-diagram-rg-caption-graphviz-html-c9e4`

**Paste file:** [`.cursor/prompts/inventory-diagram-rg-caption-03-graphviz-png-parity.md`](../../.cursor/prompts/inventory-diagram-rg-caption-03-graphviz-png-parity.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramGraphvizHtmlNodeLabel.Format appends a third line with ResourceGroupCaption when set so inventory Download PNG matches forest cards. Existing no-RG HTML fixture stays exact.

TryRenderInventoryPngAsync uses Graphviz for inventory-forest. Do not switch PNG to forest SVG. Do not add DOT clusters. Do not implement IDR-02 here.

Read first:
- .cursor/prompts/inventory-diagram-rg-caption-00-index.md
- .cursor/prompts/inventory-diagram-rg-caption-03-graphviz-png-parity.md
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramGraphvizHtmlNodeLabel.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramGraphvizHtmlNodeLabelTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramGraphvizHtmlNodeLabelTests|FullyQualifiedName~DiagramNodeHumanCaptionFactoryTests'
```

---

# IDR-HOLD — No boxes, no RG packing, no flatten rewind

**This is not implementation.** Paste [`.cursor/prompts/inventory-diagram-rg-caption-04-hold.md`](../../.cursor/prompts/inventory-diagram-rg-caption-04-hold.md) only if a session starts frames, pack-by-RG, Graphviz-primary Full subscription, or undoing sparse flatten.

## Follow-on (not this wave)

Forest **RG-aware packing** + labeled frames on Full subscription is **IDA-08** ([`INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md)). Making those frames **readable** (per-cell bounds, 2 px solid stroke, space, crop, PNG) is **IDF** ([`INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md)). Nested VNet/subnet frames stay held (**IDA-HOLD** / **IDF-HOLD**). Honesty copy when subgraphs exist but forest does not paint them is still not IDR. Do not start IDA or IDF from an IDR chat.
