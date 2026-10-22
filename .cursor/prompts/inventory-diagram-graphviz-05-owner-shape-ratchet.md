# IDG-05 — Playwright ratchet: Executive 11 VNets / 6 peerings is a compact forest

**Wave:** inventory-diagram-graphviz (**IDG**). **Depends on:** IDG-01–04 merged. **Do not** implement layout/DOT/SVG in this prompt.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A mock-backed Playwright case on Inventory diagrams Executive must **fail** if the owner screenshot returns: white sea, one node on the right, fewer than **8 of 11** nodes in the default viewport, or peering pairs farther than **2× node width**. This is the lock so the next agent cannot “fix” spacing by retuning Mermaid gaps while the canvas is still dagre-spread.

## Why

IDS-04 / IDT-03 ratchets were too loose (≥4/11 visible, 280 px pairs). Tests passed while the owner still saw the sea. This prompt does not change layout; it asserts the IDG canvas.

## Context

- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts`
- `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts`
- `archlucid-ui/playwright.operator-mock.config.ts` — **do not** add the spec to `playwright.mock.config.ts` if the existing infra-diagrams spec is already on `playwright.operator-mock.config.ts`
- IDG-03 response shape: mock `layoutSvg` + `layoutEngine: "graphviz-fdp"` for the owner-shape case. Also keep a fail-soft Mermaid-only case that **must not** be the owner-shape default.

## What to build

1. Fixture: owner-shape **11 VNets, 6 peering edges**. Prefer injecting a **compact Graphviz SVG** (viewBox tight around a 3-column-ish cluster) as `layoutSvg` so the test measures the engine IDG actually ships — not a dagre plate. Document in a comment that the SVG is a stand-in for `fdp` output; node `id`/`class` must match what IDG-04’s fit queries.
2. Assertions (`@release-gate`):
   - Status strip still reports 11 nodes · 6 edges (subgraph count may be 0 — packing chrome is not required for Graphviz).
   - Edges table still has 6 rows.
   - **≥ 8** of 11 node labels visible in `[data-testid="architecture-diagram-viewport"]` at default zoom.
   - Max center-to-center distance of a mocked peering pair ≤ **2×** that pair’s node box width.
   - viewBox width/height ≤ **1.2×** node-union (no empty plate).
3. Keep existing IDL-06 zero-edge grid and legacy-chain cases. Do not delete them.
4. If the spec fails because IDG-03/04 did not land, **do not** loosen thresholds — report which prompt is missing.
5. No production renderer changes in this prompt.

## Acceptance criteria

- Operator-mock Playwright: owner-shape Graphviz canvas passes the compact-forest checks.
- Mermaid-only fail-soft fixture still renders (no crash), even if it would fail the compact assertions — do **not** apply the 8/11 rule to the fail-soft path.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** change ArtifactSynthesis or Dockerfile here.
- Verification: `cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout`
- Heartbeat every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
