# IDH-02 — Viewer: default 100% on new source, never crop from unmapped bbox, drop dead ranker

**Wave:** inventory-diagram-human (**IDH**). **Depends on:** none (viewer-only; works before or after IDH-01). **Do not** implement IDH-01 or IDH-03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The inventory / architecture mermaid canvas must paint the **owner export** at **100% zoom** as a readable forest (all 11 nodes in the default 1180-class viewport, ~15 px labels). Zoom must not stay at 30% when a new mermaid source arrives. `viewBox` must never be taken from unmapped `g.node.getBBox()`.

## Why

The owner screenshot shows zoom **30%**, two tiny honey nodes, dual scrollbars. The exported `.mmd` at Mermaid 11.17.2 + current contain-fit is 1128×208, **11/11 visible at 100%**, and still 11 visible at 30% (just 13 px tall, **no** scroll). That screenshot is not this source under the current camera.

Two viewer bugs still bite a repeat professional:

1. `diagZoom` is URL state. A user who zoomed out to hunt a previous empty plate keeps `diagZoom=0.3` on the next render. `useDiagramZoomState` hydrates from the URL on every search change. Reset to 1 when `mermaidSource` changes (unless the change is only whitespace).
2. Unmapped `getBBox` on this export unions to **≈273×43** (local boxes centred on the origin). Using that as `viewBox` would crop to one node. `mapLocalBBoxToSvgUserSpace` is the only legal crop input. Keep IDL-07 / IDS-03 mapped-union behaviour; add a regression test with the owner geometry (mapped union ≈1112×192, unmapped ≈273×43 — mapped wins).
3. `ranker: "network-simplex"` is not forwarded to dagre. Delete it so the next agent does not “tune” a no-op.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `useDiagramZoomState`, mermaid `useLayoutEffect`
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` — `diagZoom` is a **scale** (0.3), not a percent; the input shows percent
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — drop `ranker`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.test.ts`
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `resolveMermaidNodeUnionViewBox`, `readMappedNodeUnionBBox`
- `archlucid-ui/src/lib/help/help-mermaid.test.ts`
- Help-topic `MermaidDiagram` — **must not change** (width-fill path)
- Optional: remove `alpack` CSS in `MERMAID_SVG_HOST_CLASSNAME` (dead once IDH-01 lands; safe to delete now)

## What to build

1. When `mermaidSource` (trimmed) changes, set zoom to `1` and rewrite the URL without a stale `diagZoom` (same helper as reset zoom). Do not reset on theme/dark toggles. Comment: 100% is contain-fit, not “native mermaid pixels”.
2. In `ensureMermaidInkViewBox` / node-union crop: if you can read local `getBBox` but `getCTM` mapping fails, **keep the source viewBox**. Never apply the unmapped union. Add a unit test: source `0 0 1128 208`, 11 local boxes each ≈ `(-136,-21,273,43)` unmapped, mapped union `13,8,1112,192` → resolved viewBox follows **mapped** union + padding, not 273×43.
3. Remove `ranker` from `createArchitectureDiagramMermaidConfig` and its test assertion. Keep `nodeSpacing` / `rankSpacing` / `padding` / `curve: "linear"` / `wrappingWidth` as they are on trunk (do not re-tune IDS-01 numbers in this prompt).
4. Delete `alpack` cluster-hiding CSS if present (`g[id*="alpack"]`). IDH-01 will not emit those ids.
5. Vitest: zoom reset on source change (existing `ArchitectureDiagramViewer.test.tsx` URL tests). Help mermaid crop test as in (2).

## Acceptance criteria

- Loading the owner `.mmd` into the mermaid viewer with no `diagZoom` query paints at 100% (zoom input `100`).
- Replacing `mermaidSource` with a different string clears a previous `diagZoom=0.3`.
- Crop test proves unmapped 273×43 is rejected.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change ArtifactSynthesis. **Do not** lower `MERMAID_VIEWPORT_MIN_FIT_SCALE`. **Do not** switch help-topic mermaid to this camera.
- TB-645. Sentence case. Visible-boundary `Button`.
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`. No Playwright in this prompt. No full-solution `dotnet` build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
