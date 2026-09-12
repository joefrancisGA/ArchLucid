# IDS-01 — Compact Mermaid spacing, linear connectors, network-simplex ranker

**Wave:** inventory-diagram-spacing (**IDS**). **Depends on:** none (viewer-only). **Do not** implement IDS-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory / architecture Mermaid init must pack nodes and draw **short, nearly-straight connectors**. Disconnected components must share ranks the way `network-simplex` does, not `tight-tree`'s one-tree-per-rank spread. Do not change AST emission.

## Why

Owner screenshot 2026-09-12 (post-IDL): Executive, 11 nodes · 6 edges · 0 subgraphs. One readable node on the right of a large empty canvas. Connectors (when scrolled into view) span most of the plate.

`createArchitectureDiagramMermaidConfig` today:

- `nodeSpacing: 48`, `rankSpacing: 56`, `padding: 18` — dagre gaps on top of already-wide VNet labels
- `curve: "basis"` — d3 basis splines bow out; the path bbox is much larger than the node union; IDL-04 then trusts Mermaid's padded viewBox
- no `ranker` — Mermaid 11 default is `tight-tree`, which assigns ranks per tiny peering tree and places components far apart

IDL-03's 11 px floor then refuses to shrink that sparse plate. This prompt only changes **how Mermaid lays out ink**. Packing (IDS-02) and crop (IDS-03) are separate.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — `createArchitectureDiagramMermaidConfig`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `MERMAID_SVG_HOST_CLASSNAME` (cluster rect styles)
- `archlucid-ui/src/lib/infra-evidence/export-mermaid-source-to-png.ts` — reuses the same init (PNG export must match the canvas)
- Mermaid 11.17 flowchart keys (confirm in `node_modules/mermaid` types if present): `nodeSpacing`, `rankSpacing`, `padding`, `curve`, `ranker`, `wrappingWidth`
- Help-topic `MermaidDiagram` — **must not change**; it has its own init

## What to build

1. In `createArchitectureDiagramMermaidConfig` set:
   - `nodeSpacing: 24`
   - `rankSpacing: 28`
   - `padding: 8`
   - `curve: "linear"` (straight connectors; not `basis`)
   - `ranker: "network-simplex"` (disconnected peering pairs share ranks: sources together, targets together)
   - `wrappingWidth: 240` (long `vnet-…` labels wrap instead of becoming 400 px-wide nodes that then space apart)
   Extend the function's declared `flowchart` type so `ranker` and `wrappingWidth` type-check. Comment why `tight-tree` + `basis` produced the empty-plate screenshot (two-year-developer comment).
2. Export the numeric constants (`ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING`, `RANK_SPACING`, `PADDING`, `WRAPPING_WIDTH`) next to `ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE` so IDS-04 can import them. Do not magic-number them in tests.
3. `ArchitectureDiagramViewer` host CSS: cluster rects for packing subgraphs (IDS-02 will emit ids / classes prefixed `alpack`) must be chrome-less — `fill: transparent; stroke: none`. Add a selector that matches Mermaid's subgraph group when the id or class contains `alpack` (verify the live attribute in a unit-level class string test; do not require a browser). Harmless until IDS-02 lands.
4. Tests in `architecture-diagram-mermaid-config.test.ts` (fail on master, pass after):
   - light and dark configs: `nodeSpacing === 24`, `rankSpacing === 28`, `padding === 8`, `curve === "linear"`, `ranker === "network-simplex"`, `wrappingWidth === 240`
   - `useMaxWidth` stays `false`; `htmlLabels` stays `false`; honey fill / dark text unchanged
5. Do **not** change `help-mermaid.ts` fit math, IDL-03 clamps, or IDL-04 crop.

## Acceptance criteria

- PNG export and the on-page canvas share the same compact init.
- A 2-node `A -->|"peered"| B` flowchart at natural size has rank gap on the order of `28` px plus node height, not a basis bow across hundreds of px.
- Zero-edge IDL-02 grid fixtures still layout (spacing is smaller; grid shape unchanged).
- Help-topic mermaid tests untouched and green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** touch `ArchLucid.ArtifactSynthesis` (IDS-02). **Do not** touch `resolveMermaidInkViewBox` (IDS-03).
- **Do not** add elk, svg-pan-zoom, or a second Mermaid theme.
- **Do not** change `flowchart TD` emission.
- TB-645 vocabulary. Sentence case.
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`. No full build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
