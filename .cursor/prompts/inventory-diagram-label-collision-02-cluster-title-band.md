# IDLC-02 — Reserve a cluster title band above the first node

**Wave:** inventory-diagram-label-collision (**IDLC**). **Depends on:** IDLC-01 merged (or on this branch). **Do not** implement IDLC-03–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

After IDLC-01, cluster titles must sit in a **band above the first node rect**, not inside it. Do this with SVG geometry on `g.cluster` (sanitizer or a sibling helper). Do **not** raise inventory `nodeSpacing` / `rankSpacing` / plate `padding` (IDT-01 stays `16/20/6`).

## Why

Owner top-left overwrite: even a correctly classed `cluster-label` still shares pixels with the first card when Mermaid/Graphviz give the title only ~6px of cluster padding. Interior swimlanes look acceptable because they have leftover gutter; the first cluster is flush with the viewBox origin.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — run a title-band pass **after** FO conversion (IDLC-01) and **before** or after `wrapExistingNodeSvgLabels` as needed; do not undo 01
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `[&_svg_.cluster-label]` fill already exists; you may add non-layout color/weight only. Do **not** use CSS `translate` as the only fix (export PNG / sanitizer must match the canvas).
- `ARCHITECTURE_DIAGRAM_MERMAID_PADDING` remains **6** for dagre plate padding

If you extract a helper, **one class/function per file**.

## What to build

1. After labels are SVG text, for each `g.cluster`:
   - Read the cluster `rect` (or `polygon` if that is what Mermaid emitted).
   - Read `text.cluster-label` (skip empty labels / whitespace-only Graphviz `" "`).
   - If the label’s box overlaps the first descendant `g.node` rect (same cluster) by more than **1px** on the y-axis, **reserve a title band**: grow the cluster rect upward (decrease `y`, increase `height`) by at least one line (`ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX` × line-height ratio + 4px inset) **or** move the cluster-label `y` to sit fully above that first node rect, whichever needs less empty chrome.
   - Do not translate node groups (that fights viewport fit). Prefer expanding the cluster chrome / moving only the title text.
   - If the title would go above `viewBox` y=0, expand the root `viewBox` min-y / height so the title stays in the SVG (IDLC-04 still clips the HTML hint).
2. Tests in `architecture-diagram-svg.test.ts` (fail on current overlap, pass after):
   - Fixture: cluster rect `y="0" height="80"`, cluster-label at `y="8"`, node rect `y="4" height="36"` (label baseline inside the node). After sanitize/band pass: label bbox and node rect **do not overlap** on y (compare numeric `y` / `font-size` / hanging baseline; document the inequality in the test). Cluster rect still encloses the node.
   - Empty / missing cluster label: rect geometry unchanged.
   - Ordinary mermaid node wrap tests from IDLC-01 / prior FO tests stay green.
3. No Graphviz DOT. No viewport frame CSS. No IDT constant edits.

## Acceptance criteria

- First node in a cluster and the cluster title do not share a vertical pixel band in the sanitized SVG used by the inventory canvas and exportable markup.
- Plate-level mermaid `padding` stays 6.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** set `htmlLabels: true`. **Do not** restore `alpack_*`. **Do not** draw RG bounding boxes.
- Verification from `archlucid-ui/`: `npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
