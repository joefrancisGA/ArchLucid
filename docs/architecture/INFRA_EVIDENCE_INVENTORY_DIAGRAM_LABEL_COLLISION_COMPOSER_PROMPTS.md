> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that stop inventory-diagram **cluster titles, node names, and the zoom hint** from painting in the same pixels. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-label-collision-00-index.md`](../../.cursor/prompts/inventory-diagram-label-collision-00-index.md) (one numbered file per session).
>
> **Do not** undo IDT-01 mermaid gaps, set `htmlLabels: true`, draw RG bounding boxes, restore `alpack_*`, or hide the stacked zoom hint. **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR**.

# IDLC-01–IDLC-04 — Inventory diagram overwritten labels

**Observed (2026-09-16):** Owner Executive inventory diagram, snapshot `bebca1aa-9fba-408a-b9ce-2794678c4281` (424 resources, 61 visible). Red circle on the **top-left** card (`vnet-app-hi-test-wus-001`). Cluster title, resource name, and the stacked zoom hint occupy the same pixels. Interior dashed groups show a small grey title on the border with gutter; the first group is flush with the canvas origin.

**Product framing (locked):** separate cluster titles from node labels; keep forest name + RG as two lines; keep the zoom hint visible and true.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Cluster FO converted to centered `nodeLabel`; forest wrap recenter; tspan flatten | **IDLC-01** | Duplicate/overwritten glyphs on first card |
| Cluster title still inside first node rect (6px band) | **IDLC-02** | Interior groups OK, top-left still collides |
| Graphviz `label=` with no margin (PNG / fdp fallback) | **IDLC-03** | Canvas honest, PNG a liar |
| SVG `overflow: visible` into stacked hint | **IDLC-04** | Hint unreadable at top-left |
| Gap rewind / htmlLabels / RG boxes / hide hint | **IDLC-HOLD** | White sea or empty FO boxes |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|----------|------------|
| **IDLC-01** Sanitize cluster vs node labels + tspan-safe normalize | First | trunk |
| **IDLC-02** Cluster title band above first node | After 01 | IDLC-01 |
| **IDLC-03** Graphviz `labelloc` / `labeljust` / `margin` | Parallel with 01 | trunk |
| **IDLC-04** Camera/ink clip vs stacked hint | Parallel with 01 | trunk |
| **IDLC-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-label-collision-<short-name>-a3c1`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests. TypeScript: no inline imports.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- The overwrite is **label collision**, not a broken zoom control overlay. Stacked layout shows the hint; overlay already `sr-only`s it.
- `replaceForeignObjectWithSvgText` always emits `class="nodeLabel"` at the FO center — cluster titles included.
- IDT-01 `16/20/6` stays. Cluster title **band** is IDLC-02, not a plate-padding rewind.
- IDR-02 forest cards already have name + muted RG as sibling `<text>` elements. Client wrap must not recenter the name.
- PNG for inventory-forest still uses Graphviz HTML / fdp (`TryRenderInventoryPngAsync`).

---

# IDLC-01 — Sanitize cluster titles and forest cards without overwriting node names

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-label-collision-sanitize-a3c1`

**Paste file:** [`.cursor/prompts/inventory-diagram-label-collision-01-sanitize-cluster-and-forest-labels.md`](../../.cursor/prompts/inventory-diagram-label-collision-01-sanitize-cluster-and-forest-labels.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: cluster foreignObjects become text.cluster-label at the top-start of the title box, not centered nodeLabel. Skip wrapExistingNodeSvgLabels on forest cards (pictogram or two+ text siblings). Do not duplicate an existing cluster-label. normalizeInfraEvidenceLayoutSvgForDisplay must not flatten tspans by setting parent text textContent.

Owner 2026-09-16 Executive top-left card: cluster title overwritten on vnet-app-hi-test-wus-001. This prompt is sanitizer + display normalize only.

This is NOT IDLC-02 title band, NOT Graphviz DOT, NOT viewport clip, NOT htmlLabels true, NOT IDT gap rewind.

Read first:
- .cursor/prompts/inventory-diagram-label-collision-00-index.md
- .cursor/prompts/inventory-diagram-label-collision-01-sanitize-cluster-and-forest-labels.md
- archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts
- archlucid-ui/src/lib/infra-evidence/normalize-infra-evidence-mermaid-display.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/lib/infra-evidence/normalize-infra-evidence-mermaid-display.test.ts
```

---

# IDLC-02 — Reserve a cluster title band above the first node

**Depends on:** IDLC-01 · **Branch:** `cursor/inventory-diagram-label-collision-title-band-a3c1`

**Paste file:** [`.cursor/prompts/inventory-diagram-label-collision-02-cluster-title-band.md`](../../.cursor/prompts/inventory-diagram-label-collision-02-cluster-title-band.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: sanitized g.cluster titles sit in a band above the first node rect. Grow cluster chrome or move only the title. Do not change ARCHITECTURE_DIAGRAM_MERMAID_PADDING / nodeSpacing / rankSpacing. Do not CSS-translate as the only fix.

Locked owner shape: 2026-09-16 top-left Executive card flush with the canvas origin.

This is NOT IDLC-03 DOT, NOT IDLC-04 hint clip, NOT IDT gap rewind.

Read first:
- .cursor/prompts/inventory-diagram-label-collision-00-index.md
- .cursor/prompts/inventory-diagram-label-collision-02-cluster-title-band.md
- archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts
```

---

# IDLC-03 — Graphviz cluster titles sit above the first member

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-label-collision-graphviz-margin-a3c1`

**Paste file:** [`.cursor/prompts/inventory-diagram-label-collision-03-graphviz-cluster-margin.md`](../../.cursor/prompts/inventory-diagram-label-collision-03-graphviz-cluster-margin.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramAstGraphvizDotEmitter cluster headers include labelloc=t, labeljust=l, and an explicit margin so fdp PNG/fallback SVG titles are not on the first node. Keep skipping alpack_* packing subgraphs. Do not change HTML node labels.

This is NOT forest emitter, NOT mermaid sanitizer, NOT IDT.

Read first:
- .cursor/prompts/inventory-diagram-label-collision-00-index.md
- .cursor/prompts/inventory-diagram-label-collision-03-graphviz-cluster-margin.md
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramAstGraphvizDotEmitterTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'
```

---

# IDLC-04 — Keep cluster title ink out of the stacked zoom hint

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-label-collision-hint-clip-a3c1`

**Paste file:** [`.cursor/prompts/inventory-diagram-label-collision-04-viewport-hint-clip.md`](../../.cursor/prompts/inventory-diagram-label-collision-04-viewport-hint-clip.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: stacked inventory viewport keeps ARCHITECTURE_DIAGRAM_VIEWPORT_HINT visible and true, but SVG overflow cannot paint those letters. Clip or pad the camera/ink host. Overlay layout stays sr-only hint + on-canvas zoom cluster.

This is NOT sanitizer, NOT DOT, NOT deleting the hint.

Read first:
- .cursor/prompts/inventory-diagram-label-collision-00-index.md
- .cursor/prompts/inventory-diagram-label-collision-04-viewport-hint-clip.md
- archlucid-ui/src/components/architecture/ArchitectureDiagramMermaidViewportFrame.tsx
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx
```

---

# IDLC-HOLD — No gap rewind, htmlLabels, RG boxes, or hidden hint

**This is not implementation.** Paste [`.cursor/prompts/inventory-diagram-label-collision-05-hold.md`](../../.cursor/prompts/inventory-diagram-label-collision-05-hold.md) only if a session starts IDT gap rewind, `htmlLabels: true`, RG frames, restoring `alpack_*`, or hiding the stacked zoom hint.

## Follow-on (not this wave)

Forest RG-aware packing + labeled frames (IDR-HOLD). Another dagre spacing pass (IDT/IDS — do not start). None of those belong in IDLC chats.
