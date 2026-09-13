> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that replace **Mermaid dagre layout** for inventory snapshot diagrams with **Graphviz `fdp` from `DiagramAst`**. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-graphviz-00-index.md`](../../.cursor/prompts/inventory-diagram-graphviz-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDL**, **IDS**, **IDT**, or **IDH**. Do **not** retune Mermaid `nodeSpacing`. Do **not** change the PowerShell extractor.
> **Follow-on (not this wave):** [`DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md`](DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md) (**DAU-01–DAU-12**) — AI compiles intent into existing modes/patches; does **not** replace Graphviz `fdp`.

# IDG-01–IDG-05 — Inventory diagrams: Graphviz layout from DiagramAst

**Observed (2026-09-13):** Inventory diagrams Executive, snapshot `bebca1aa-…` (889 resources). Green **Render succeeded — 11 nodes · 6 edges · 0 subgraphs**. One node on the right of a white sea. Saved Mermaid has no spacing directives. Owner: take any layout that is **acceptable**; do not change PowerShell.

**Prior waves:** **IDL** (honesty + camera), **IDS-01–04** packing + crop (packing subgraphs **widen** this export — do not restore `alpack_*`), **IDT** gap constants, **IDH** Mermaid row-pack without subgraphs. Owner 2026-09-13 still asked for **Graphviz**. Residual: the workbench still uses client dagre until IDG-03.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Mermaid text is not a layout engine | **IDG-01** | Still no DOT from AST; temptation to emit DOT from ARM |
| No `fdp` in the API image | **IDG-02** | DOT cannot become SVG |
| Workbench still client-dagres inventory | **IDG-03** | Owner still sees the sea |
| Camera/PNG assume Mermaid only | **IDG-04** | Tight Graphviz layout, loose camera or mismatched PNG |
| Ratchet too loose | **IDG-05** | Next wave re-diagnoses from a screenshot again |
| Extractor / `dependsOn` | **IDG-HOLD** | Fake architecture graph |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDG-01** `DiagramAst` → DOT (`fdp`) | First | trunk |
| **IDG-02** `fdp -Tsvg` + sanitizer + Docker `graphviz` | After 01 | IDG-01 |
| **IDG-03** Workbench paints SVG; Export Mermaid unchanged | After 02 | IDG-02 |
| **IDG-04** Fit + PNG match Graphviz | After 03 | IDG-03 |
| **IDG-05** Playwright compact-forest ratchet | Last | IDG-01–04 |
| **IDG-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-graphviz-<short-name>-717e`).

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`) when the fail-soft Mermaid path still exists.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- The snapshot graph is good enough: 11 VNets, 6 real peerings, outline tables match.
- Mermaid `.mmd` will never carry `nodeSpacing`. Layout is the engine. Engine is **`fdp`**, not `dot`, not dagre.
- **0 subgraphs** on the owner screenshot: packing `alpack_*` is Mermaid-dagre chrome. Graphviz must **omit** packing subgraphs from DOT.
- **IE-RF-12** / IDG-HOLD: no ARM export, no `dependsOn` arrows, no extractor DOT.
- Review-detail human Mermaid artifacts stay Mermaid. This wave is inventory snapshot canvases.

---

# IDG-01 — Emit Graphviz DOT from DiagramAst

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-graphviz-dot-emitter-717e`

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-01-diagramast-to-dot.md`](../../.cursor/prompts/inventory-diagram-graphviz-01-diagramast-to-dot.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: serialize DiagramAst to Graphviz DOT for fdp (quoted/escaped ids, visible edges only, omit alpack_* packing subgraphs). Do not invoke fdp. Do not change the UI or the Azure extractor.

Owner screenshot (do not re-diagnose): Inventory diagrams Executive, 11 nodes / 6 edges / 0 subgraphs, one node on the right of a white sea. Mermaid file has no spacing; dagre is the layout. Owner will take any acceptable diagram. Do not change PowerShell.

This is NOT a re-do of IDL, IDS, IDT, or IDH. Do not retune nodeSpacing. Do not use Graphviz dot (layered) as the default. Do not emit ARM dependsOn edges. Do not restore alpack_*. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- .cursor/prompts/inventory-diagram-graphviz-00-index.md
- .cursor/prompts/inventory-diagram-graphviz-01-diagramast-to-dot.md
- ArchLucid.ArtifactSynthesis/Models/DiagramAst.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeVisibility.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~GraphvizDot'

Done when:
- Owner-shape AST emits 11 nodes, 6 -> edges, zero alpack, escaped quotes/slashes
```

---

# IDG-02 — Server fdp SVG (sanitized) + Docker graphviz

**Depends on:** IDG-01 · **Branch:** `cursor/inventory-diagram-graphviz-fdp-svg-717e`

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-02-server-fdp-svg.md`](../../.cursor/prompts/inventory-diagram-graphviz-02-server-fdp-svg.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: run Graphviz fdp (not dot) with DOT on stdin to produce sanitized SVG. apk add graphviz in the API Dockerfile runtime stage (before USER archlucid). Fail soft if fdp is missing. Reuse SvgDiagramSanitizer. Do not change OpenAPI or the workbench yet.

Do not edit Get-ArchLucidAzurePackage.ps1. Do not log customer DOT/SVG. Do not add a Terraform module (same as mermaid-cli).

Read first:
- .cursor/prompts/inventory-diagram-graphviz-00-index.md
- .cursor/prompts/inventory-diagram-graphviz-02-server-fdp-svg.md
- ArchLucid.Api/Dockerfile
- ArchLucid.ContextIngestion/Diagram/SvgDiagramSanitizer.cs
- ArchLucid.Application/Diagrams/MermaidCliDiagramImageRenderer.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~Graphviz'

Done when:
- fdp argv/stdin wiring covered; sanitizer rejects script; missing binary does not throw; Dockerfile installs graphviz
```

---

# IDG-03 — Inventory canvas paints Graphviz SVG

**Depends on:** IDG-02 · **Branch:** `cursor/inventory-diagram-graphviz-canvas-svg-717e`

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-03-inventory-canvas-svg.md`](../../.cursor/prompts/inventory-diagram-graphviz-03-inventory-canvas-svg.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory snapshot mermaid GET returns sanitized LayoutSvg when fdp succeeded. Inventory diagrams workbench paints that SVG. Export Mermaid still downloads Mermaid text. Fail soft to client Mermaid if LayoutSvg is null. Review-detail human Mermaid artifacts stay client Mermaid.

Do not retune nodeSpacing. Do not change the extractor. Additive OpenAPI fields only.

Read first:
- .cursor/prompts/inventory-diagram-graphviz-03-inventory-canvas-svg.md
- ArchLucid.Contracts/InfraEvidence/InfraEvidenceMermaidRenderResponse.cs
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaid'
cd archlucid-ui && npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx src/components/architecture/ArchitectureDiagramViewer.test.tsx

Done when:
- layoutSvg present → no mermaid.render; mermaid string still present for export; Graphviz down → mermaid canvas
```

---

# IDG-04 — Fit Graphviz SVG and match PNG

**Depends on:** IDG-03 · **Branch:** `cursor/inventory-diagram-graphviz-fit-png-717e`

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-04-fit-and-png.md`](../../.cursor/prompts/inventory-diagram-graphviz-04-fit-and-png.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Graphviz SVG uses the inventory viewport camera (contain-fit, 11 px floor, node-union crop). Inventory Export PNG uses fdp -Tpng (or SVG raster) when LayoutEngine is graphviz-fdp, not mermaid-cli dagre.

Do not change zoom percent meaning. Do not touch help-topic Mermaid width-fill beyond sharing a helper.

Read first:
- .cursor/prompts/inventory-diagram-graphviz-04-fit-and-png.md
- archlucid-ui/src/lib/help/help-mermaid.ts
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaid'

Done when:
- padded Graphviz viewBox crops to node union; PNG mock uses Graphviz when engine is fdp
```

---

# IDG-05 — Owner-shape compact-forest Playwright ratchet

**Depends on:** IDG-01–04 · **Branch:** `cursor/inventory-diagram-graphviz-ratchet-717e`

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-05-owner-shape-ratchet.md`](../../.cursor/prompts/inventory-diagram-graphviz-05-owner-shape-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: operator-mock Playwright for Executive 11 VNets / 6 peerings with layoutSvg must fail if fewer than 8 of 11 nodes are in the default viewport, peering pairs exceed 2× node width, or the viewBox is more than 1.2× the node union.

Do not change layout code. If the spec fails, report which IDG prompt is missing. Do not loosen thresholds.

Read first:
- .cursor/prompts/inventory-diagram-graphviz-05-owner-shape-ratchet.md
- archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts
- archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout

Done when:
- @release-gate owner-shape Graphviz case asserts compact forest; fail-soft mermaid path still renders
```

---

# IDG-HOLD — Not implementation

**Paste file:** [`.cursor/prompts/inventory-diagram-graphviz-06-hold.md`](../../.cursor/prompts/inventory-diagram-graphviz-06-hold.md) only if a session starts extractor DOT, ARM `dependsOn`, or a second collector.
