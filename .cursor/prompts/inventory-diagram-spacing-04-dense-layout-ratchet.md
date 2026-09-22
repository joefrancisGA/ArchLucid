# IDS-04 — Mock-backed browser ratchet for compact inventory diagrams

**Wave:** inventory-diagram-spacing (**IDS**). **Depends on:** IDS-01–03 landed. Run last.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A Playwright spec that renders the real Inventory diagrams page with a mocked Mermaid payload matching the **owner screenshot shape** (11 VNets, 6 peering `-->` edges, packing `~~~`, `alpack-*` subgraphs) and fails when:

- fewer than **4** nodes are visible inside the viewport at default zoom, or
- a peering pair's node-center distance exceeds a compact threshold, or
- the SVG viewBox is more than **1.5×** the node-union on either axis (empty plate), or
- outline Edges rows ≠ 6, or layout-only links appear as arrows.

## Why

IDL-06 ratchets the **zero-edge grid** and the **legacy chain**. It cannot fail the post-IDL owner screenshot: 6 real peerings, sparse forest, one node in a white sea. Vitest/jsdom cannot measure that. This prompt is the screenshot encoded as a test.

## Context

- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` — IDL-06 spec (keep existing cases)
- `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts` — add an owner-shape builder **alongside** the grid/chain fixtures
- `archlucid-ui/playwright.operator-mock.config.ts` — `testMatch` already includes this file
- Route: `/governance/infrastructure/diagrams?snapshotId=…&mermaidMode=executive`
- Viewport: 1440 × 1400 (same as IDL-06)
- IDS-02 emission contract: `flowchart TD`, 11 node lines, 6 `-->|"peered"|` (or unlabelled `-->` if the fixture omits labels — prefer `peered`), `~~~` between packing representatives, `subgraph alpack-…`

If IDS-02's exact Mermaid text is not yet on the branch, **fail** — do not loosen the fixture to a hand-wavy chain. Rebase 02.

## What to build

1. `elevenVnetSparsePeeringMermaid()` in `e2e/fixtures/infra-diagrams-mermaid.ts`:
   - Same 11 labels as `VNET_LABELS` (owner names).
   - Six peering edges matching the owner Edges table as closely as the 11-node set allows. If a listed `To` is not in `VNET_LABELS`, substitute the remaining in-list VNet so the fixture stays 11 nodes / 6 visible edges / >1 component. Document the substitution in a one-line comment.
   - Packing subgraphs + `~~~` as IDS-02 emits (copy a golden snippet from the ArtifactSynthesis renderer test if needed so the fixture cannot drift).
   - `metrics.edgeCount: 6`, `nodeCount: 11`, `subgraphCount` = packing cluster count (not 0 if 02 wraps components).
2. New test in `infra-diagrams-layout.mock.spec.ts` (same `@release-gate` describe):
   - Mock routes with the sparse-peering response (same helper as IDL-06).
   - After render (wait for `architecture-diagram-svg-host svg`, 1500 ms settle):
     - **Visible count:** number of `g.node` whose `getBoundingClientRect()` intersects the viewport client rect by ≥ 50% of the node area ≥ **4**.
     - **Pair distance:** for each `-->` peering pair, Euclidean distance between node-box centers ≤ `max(280, 3.5 × max(nodeW, nodeH))` px. Fail with both centers and the threshold in the message.
     - **Empty plate:** parse `svg.viewBox`; union of node `getBBox()` (user space) width/height × 1.5 must be ≥ viewBox width/height on each axis (viewBox not more than 50% larger than ink).
     - **Honesty:** Edges outline `tbody tr` length === 6; `g.edgePaths path` count ≥ 6 (the real arrows). `~~~` must not produce a visible stroked path with non-zero length outside those six — if Mermaid still emits a path for `~~~`, assert `stroke: none` or `opacity: 0` / zero computed width.
     - **Legibility:** min node height ≥ `MERMAID_MIN_LEGIBLE_LABEL_FONT_PX × 1.6` (do not regress IDL-06).
   - On failure: `testInfo.attach` `svg.outerHTML` (IDL-06 already does this pattern).
3. Keep the existing grid + legacy-chain tests. Do not lower their thresholds to make 04 pass.
4. One-paragraph note in `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md` under the IDL-06 instruction: sparse-peering fixture command is the same `infra-diagrams-layout` file.

## Acceptance criteria

- Spec fails on trunk **before** IDS-01–03 if the mock still uses the un-packed 6-edge TD forest (one/two nodes in view, viewBox padded). After 01–03, it passes.
- Runtime of the new case under 60 s. Do not add it to `playwright.mock.config.ts` (buyer demo flags hide the operator route).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change viewer or backend code here. If the assertion fails after 01–03 merged, report which prompt regressed; do not loosen the visible-count below 4 or the 1.5× plate ratio.
- TB-645 vocabulary. Sentence case.
- Verification: `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout` from `archlucid-ui/` (existing standalone build). Report runtime. No full-solution `dotnet` build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
