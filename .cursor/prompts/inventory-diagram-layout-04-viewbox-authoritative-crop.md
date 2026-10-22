# IDL-04 — Mermaid viewBox is authoritative; measured crop may tighten, never clip

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** none (viewer-only). **Do not** implement IDL-05–06. Do not re-run IDC-02.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The ink-crop step in `help-mermaid.ts` must never produce a viewBox smaller than the union of node boxes. Mermaid's own emitted `viewBox` (whole-graph bounds plus padding) is the baseline; the measured crop is applied only when it is **consistent** with the baseline and strictly tightens it.

## Why

Reproduced 2026-09-12 with a 4-column grid fixture (11 VNets, invisible `~~~` links): node transforms span x `131 → 973`, y `37 → 277` (ink ≈ 1100 × 320), but `readMermaidInkBBox` produced viewBox `119.31 54.5 865.58 205.75`. The first row and the left column rendered outside the viewport. The tall chain fixture happened to crop correctly, which is why IDC-02 looked closed. `mapLocalBBoxToSvgUserSpace` scales by `getScreenCTM()` at measure time while the SVG is still `width:100%; height:auto` (from `prepareMermaidSvgForResponsiveLayout`), and `isLikelyOriginOnlyInkCrop` swaps in group boxes on a heuristic. The result is cached per SVG element (`mermaidInkViewBoxBySvg`); `resetMermaidSvgViewportInkCache` is exported but never called.

## Context

- `archlucid-ui/src/lib/help/help-mermaid.ts` — `readMermaidInkBBox`, `readMappedNodeInkBBox`, `mapLocalBBoxToSvgUserSpace`, `isLikelyOriginOnlyInkCrop`, `ensureMermaidInkViewBox`, `applyMermaidSvgInkViewBox`, `prepareMermaidSvgForResponsiveLayout`
- `archlucid-ui/src/lib/help/help-mermaid.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `applyMermaidViewportCamera`; `svgMarkup` effect (where a new SVG element is inserted)
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `sanitizeArchitectureDiagramSvg` (runs before the crop; must preserve the original `viewBox` attribute)
- `.cursor/prompts/inventory-diagram-collapsed-canvas-02-ink-bbox-user-space.md` — prior intent (keep user-space mapping, fix its use)

## What to build

1. `prepareMermaidSvgForResponsiveLayout`: before overwriting `width` / `height`, copy Mermaid's original `viewBox` into `data-al-source-viewbox` on the `<svg>`. Ensure `sanitizeArchitectureDiagramSvg` (DOMPurify) keeps `data-*` attributes on `svg` (add to `ADD_ATTR` if needed).
2. New pure function `resolveMermaidInkViewBox(sourceViewBox: DOMRect | null, measuredInk: DOMRect | null, paddingPx: number): DOMRect` (own export, unit-testable without DOM):
   - No source → measured (+ padding) or `null` behavior as today.
   - No measured → source.
   - Measured **inside** source and `measured.width ≥ 0.6 × source.width && measured.height ≥ 0.6 × source.height` → measured + padding (tightening a padded canvas is allowed).
   - Otherwise (measured smaller than 60% on either axis, or extends outside source) → **source**. Comment why: a mis-mapped bbox clips rows; a whole-graph viewBox is always safe.
3. `ensureMermaidInkViewBox` uses `resolveMermaidInkViewBox` with the parsed `data-al-source-viewbox`. Remove `isLikelyOriginOnlyInkCrop` if the new rule makes it redundant (it does — prove with a test), otherwise keep it strictly as a tiebreak.
4. Cache hygiene: call `resetMermaidSvgViewportInkCache(svg)` from `ArchitectureDiagramViewer` whenever a new SVG element is inserted (in the effect that sets `svgMarkup`, after mount), and on `retryRender`.
5. Tests (fail on master, pass after):
   - `resolveMermaidInkViewBox`: source `0 0 1144 322`, measured `119 54 866 206` → returns source (not measured).
   - Source `0 0 4000 3000`, measured `1200 900 1500 1100` → returns measured + padding (padded canvas tightening).
   - Measured extends outside source → source.
   - Integration in `help-mermaid.test.ts` with a jsdom SVG carrying `data-al-source-viewbox="0 0 1144 322"` and stubbed `getBBox` returning the bad `866 × 206` box → final `viewBox` is `-p -p 1144+2p 322+2p`.
   - `prepareMermaidSvgForResponsiveLayout` preserves `data-al-source-viewbox`; `sanitizeArchitectureDiagramSvg` keeps it.

## Acceptance criteria

- Grid fixture: all 11 nodes inside the fitted SVG bounds; no clipped row/column.
- Chain fixture: viewBox unchanged from today's (measured box is ≥ 60% of source and inside it).
- Help-topic `MermaidDiagram` unaffected (it uses `fitMermaidSvgElementToHost`; if it shares `readMermaidInkBBox`, its tests must stay green).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change zoom semantics or fit scale clamps (IDL-03). **Do not** touch backend.
- **Do not** add dependencies.
- TB-645 vocabulary. Sentence case.
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/help/help-mermaid.test.ts src/lib/architecture/architecture-diagram-svg.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`. No full build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
