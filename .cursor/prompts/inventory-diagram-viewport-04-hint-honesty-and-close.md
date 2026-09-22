# IDV-04 — Viewport hint honesty and close tests

**Wave:** inventory-diagram-viewport (**IDV**). **Depends on:** IDV-01, IDV-02, IDV-03. Last prompt.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Lock the leftover honesty and regression tests so Executive inventory diagrams cannot regress to “controls too far apart” or “zoom to 10% to see the graph.”

## Why

`ARCHITECTURE_DIAGRAM_VIEWPORT_HINT` still says `Ctrl+scroll to zoom · + / − keys · 0 resets to 100%`. Before IDV-02 the mermaid canvas had **no wheel handler**. If IDV-02 wired wheel, the hint must match (including “focus the diagram first” if keys are on the viewport, not `window`). If 0 resets to fitted 100% (viewport contain) rather than native mermaid 1:1 pixels, the hint must not lie.

This prompt is the wave close. Do not re-open fit math, camera design, or chrome layout unless a test proves IDV-01–03 did not land.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-copy.ts`
- `ArchitectureDiagramViewer.test.tsx`
- `help-mermaid.test.ts`
- `DiagramsWorkbenchClient.tsx` — still passes `mermaidSource`, `fullscreenTitle`, `scopeContextLine`
- Index: `.cursor/prompts/inventory-diagram-viewport-00-index.md`

## What to build

1. Align `ARCHITECTURE_DIAGRAM_VIEWPORT_HINT` (and any `title=` on buttons) with actual behavior after IDV-02: modifier+scroll, focused `+`/`−`/`0`, what 100% / Fit means. Sentence case. No “pinch the page.”
2. Vitest ratchet (add if missing from 01–03):
   - Tall-narrow fixture contain-fits into a bounded viewport (height not `width × tallAspect` in the thousands).
   - Mermaid viewer viewport **contains** zoom controls + Fullscreen.
   - Fit in view does not write `diagZoom=0.10` for a small graph.
   - Ctrl+wheel on the mermaid viewport changes zoom.
3. Do **not** add Playwright/e2e unless already running in this folder’s unit graph. No new ADR.
4. Short close note in the PR (or a `docs/architecture/` one-pager only if you already touch docs): IDV-01–04 done; `#3013` mermaid compile kept; `#2951` flatten kept; flowchart TD unchanged.

## Acceptance criteria

- Hint text is true on Inventory diagrams Executive.
- Tests named above fail if someone restores width-stretch + CSS-scale-as-layout + Fullscreen-above-the-hole.
- Help mermaid width-fill tests still pass.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** implement a new diagram mode or change `MermaidDiagramRenderer` to `flowchart LR`.
- **Do not** re-run IE-UX-02, SH-13, or `#3013`.
- TB-645. Sentence case.
- Verification: focused Vitest from `archlucid-ui/` listed above. No full-solution build, no dev server unless this file says so.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
