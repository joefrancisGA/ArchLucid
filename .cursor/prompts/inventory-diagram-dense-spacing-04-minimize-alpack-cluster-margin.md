# IDT-04 — Minimize alpack compound-subgraph margin

**Wave:** inventory-diagram-dense-spacing (**IDT**). **Depends on:** IDT-02 (stable `alpack_*` emission). **Do not** implement IDT-01 or IDT-03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Packing subgraphs (`alpack_*`) must not reserve **extra dagre cluster padding** beyond what two-node peering pairs need. Transparent fill/stroke is not enough — the compound graph bbox still inflates horizontal separation.

## Why

Each peering pair is wrapped in `subgraph alpack_N`. Mermaid 11 / dagre-d3-es assigns **cluster margins** around compound nodes. IDS-02 hid chrome visually; dagre still lays out five wide cluster boxes on one rank when grid links are sparse (fixed in IDT-02, but margin may remain).

## Context

- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — `style alpack_N fill:transparent,stroke:none`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `alpack` cluster CSS selectors
- Mermaid 11 flowchart / themeVariables — check `nodeSpacing`, `padding`, cluster-specific keys in `node_modules/mermaid` types
- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` — sparse-peering case (should stay green with IDT-03 thresholds)

## What to build

1. Research Mermaid 11.17 knobs for **subgraph/cluster** internal padding (e.g. `themeVariables.clusterPadding`, `flowchart.padding`, classDef on `cluster`). Apply the smallest value that does not clip 11 px labels.
2. If Mermaid exposes no cluster padding: emit `classDef alpackCluster padding:0` (or documented equivalent) and `class alpack_N alpackCluster` in `MermaidDiagramRenderer` for packing subgraphs. Prove with a renderer unit test on emitted text.
3. Mirror any cluster padding override in `ArchitectureDiagramViewer` host CSS if Mermaid paints via `.cluster rect` (complement existing transparent stroke rules).
4. Do **not** change non-`alpack` region subgraphs (`Region ` prefix exempt).
5. Vitest: extend `ArchitectureDiagramViewer.test.tsx` if class/CSS selectors change.

## Acceptance criteria

- Owner-shape sparse-peering mock: `maxHorizontalGapRatio` improves vs IDT-02-only (measure in Playwright or report before/after in PR).
- Region swimlane subgraphs unchanged.
- Help-topic `MermaidDiagram` path untouched.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** remove `alpack_*` wrapping (IDT-02 grid depends on compound nodes).
- Verification: `cd archlucid-ui && npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx` plus sparse Playwright case from IDT-03.
