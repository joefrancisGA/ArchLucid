# IDF-05 — Viewport crop includes resource-group frames

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-02 (labels inside; crop must still include stroke). **Do not** implement Graphviz clusters, ratchet-only tests beyond this file, or IDF-06–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Fit in view / ink crop for inventory-forest SVG includes **`g.rg-frame`** geometry (rect + label halo), not only `g.node`. A 2 px frame stroke and an inside label must not clip at the camera edge.

## Why

`archlucid-ui/src/lib/help/help-mermaid.ts` `queryInventoryDiagramNodeElements` selects `g.node` and Graphviz `g[id^="node"]` only. Crop padding is **12 px** — exactly IDA-08's frame pad — so the frame border sits on the crop and the old outside label (`y - 4`) fell **outside**. Owner 2026-09-16 screenshot shows clipped top labels. After IDF-03 the stroke is 2 px; half of it will vanish unless the union includes the frame.

## Context

- `archlucid-ui/src/lib/help/help-mermaid.ts` — `queryInventoryDiagramNodeElements`, `readMappedNodeInkBBox`, `readMappedNodeUnionBBox`, `ensureMermaidInkViewBox`, default `paddingPx = 12`
- Tests: `archlucid-ui/src/lib/help/help-mermaid.test.ts` (crop / node-union cases)
- Viewer: `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — uses the help-mermaid fit helpers
- Forest SVG: `g.rg-frame` / `g.rg-frames` from `DiagramForestResourceGroupFrameSvgEmitter`
- IDA-11 overflow camera — do **not** revert IDH-02 100% on graphs that fit

**Do not** include `g.edges` / `g.legend` in the **node** union (legend already expands server viewBox). Adding frames must not re-introduce Bézier-inflated empty seas.

## What to build

1. Extend ink queries used for inventory fit:
   - Include `g.rg-frame` (and if needed `g.rg-frames > g.rg-frame`) in the union **in addition to** `g.node`.
   - Keep Graphviz `g[id^="node"]` for fallback SVG.
   - Name the helper clearly (`queryInventoryDiagramInkElements` or add a sibling query) so Mermaid cluster rects are **not** accidentally selected on dagre fallback unless they are real inventory clusters.

2. Padding: keep **12 px** around the **combined** node+frame union. Do not raise to 24 as a substitute for including frames. 2 px stroke is inside the frame bbox `getBBox`.

3. Tests (Vitest):
   - Synthetic SVG: nodes at (20,20), `g.rg-frame rect` at (8,8) 200×80, label halo above/inside — cropped viewBox **minX/minY include the frame**, not the node origin alone.
   - SVG with only `g.node` (no frames): crop behavior unchanged.
   - Existing mis-mapped / huge viewBox cases still pass.

4. Playwright layout project: if a forest fixture already paints frames, assert the fitted camera does not clip `g.rg-frame` (element bbox inside viewport ±2 px). If the 11-VNet owner mock has **0** frames, add a **small** mock `layoutSvg` with two framed cells rather than loosening 11-VNet numbers.

## Acceptance criteria

- Fit in view keeps the full frame stroke and label halo on screen.
- Frameless diagrams crop as they do today.
- No empty-sea regression from including edge paths.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-06–07. **Do not** retune Mermaid `nodeSpacing`. **Do not** skip `pull_request` on the layout project.
- Verification: `cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts`. Optional: `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
