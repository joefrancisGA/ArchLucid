# IDA-11 — Fit in view only when ink overflows

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-04 (card sizes change overflow). **Do not** implement IDA-12 ratchet except to leave hooks. **Do not** revert IDH-02.

Do not implement from the wave index. Implement only *What to build*.

## Goal

If the mapped diagram ink **fits** the inventory viewport at 100%, stay at **100%** (IDH-02: reset `diagZoom` on `mermaidSource` / `layoutSvg` change). If ink **overflows** that viewport, default the camera to **Fit in view** (contain) so the owner does not land on a cropped honey/slate corner. User zoom after that still wins until the source changes.

## Why

IDH-02 locked 100% because a persisted 30% made eleven VNets look like two dots. That lock is correct for the **owner 11/6 export**, which fits. Full subscription forests after IDA-04 may still overflow `max-h-[36rem]`/`42rem`. Forcing 100% there restores dual scrollbars. Overflow, not node count, is the predicate — so 11 VNets stay 100% even if someone later adds a 12th isolate.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `fitMermaidSvgElementToViewport` / mapped bbox
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` — `diagZoom`
- IDH-02 paste: `.cursor/prompts/inventory-diagram-human-02-viewer-zoom-and-camera.md`
- Tests: `ArchitectureDiagramViewer.test.tsx`, `help-mermaid.test.ts`, `architecture-diagram-zoom.test.ts`

Do **not** change the 11 px legibility floor (IDL-03). Fit may scale **down** only; never scale up past 100% for overflow default (no giant 2-node cards).

## What to build

1. After layout SVG/Mermaid paints and mapped union is known:
   - `fits = unionWidth <= viewportClientWidth && unionHeight <= viewportClientHeight` (use the same mapped union as crop, not unmapped `getBBox`).
   - If `fits`: zoom = 1 (100%), same as IDH-02.
   - If not `fits`: apply existing Fit-in-view contain math once (the control already does this on click).
2. Source change still **clears** stored `diagZoom` then runs the predicate (do not restore 30% from URL if the new source fits — keep IDH-02 URL reset behavior unless tests already allow query override; do not expand URL zoom scope).
3. Copy: do not add a toast. Optional helper line already mentions Fit in view.
4. Tests:
   - Small SVG (union 400×200) + viewport 1180×576: zoom control **100**.
   - Large SVG (union 3000×2000) + viewport 1180×576: after render, zoom is the contain percentage (**< 100**), all test-id nodes in the fixture still in the viewport if the existing focus helpers allow querying that.
   - Do **not** weaken IDH-02 tests that mermaidSource change resets zoom for the owner-sized plate.

5. No Playwright in this prompt (IDA-12). No forest C# changes.

## Acceptance criteria

- Owner 11/6 at current packing: still 100% default.
- A forest that overflows the camera defaults to Fit in view.
- Legibility floor unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** reintroduce unmapped `getBBox` crop. **Do not** retune Mermaid gaps.
- Verification: `cd archlucid-ui && npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx src/lib/help/help-mermaid.test.ts src/lib/architecture/architecture-diagram-zoom.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build / no `next dev`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
