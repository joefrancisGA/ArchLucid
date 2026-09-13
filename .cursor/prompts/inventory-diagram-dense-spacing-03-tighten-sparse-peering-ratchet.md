# IDT-03 — Tighten sparse-peering Playwright ratchet

**Wave:** inventory-diagram-dense-spacing (**IDT**). **Depends on:** IDT-02 (updated golden fixture). **Do not** implement IDT-01 or IDT-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The sparse-peering mock test must **fail** on layouts where nodes sit too far apart — at the same strictness as the zero-edge peer-grid case — so the owner screenshot cannot regress unnoticed.

## Why

`infra-diagrams-layout.mock.spec.ts`:

- **Peer grid** (zero edges): `maxHorizontalGapRatio ≤ 0.75`, `heightSpanRatio ≤ 0.85`, viewBox ratios ≤ 1.25.
- **Sparse peering** (owner shape): only ≥ **4** visible nodes, pair distance ≤ `max(280, 3.5×nodeSize)`, viewBox ≤ **1.5×** union.

IDS-04 passed with a layout the owner still calls too sparse. Thresholds encode the bug as green.

## Context

- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts`
- `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts` — `elevenVnetSparsePeeringRenderResponse()` (must match IDT-02 golden)
- `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md` — IDL-06 / IDS-04 instruction block

## What to build

1. In the sparse-peering test `page.evaluate` block, reuse the peer-grid **horizontal gap** math (`sortedByRow`, `firstRow`, `maxHorizontalGapRatio`).
2. Tighten assertions (defaults; adjust only if IDT-01+02 cannot meet them — then fail and report):
   - `visibleNodeCount >= 8` (was 4)
   - `maxHorizontalGapRatio <= 0.5` (stricter than peer grid 0.75)
   - `heightSpanRatio <= 0.7`
   - `viewBoxWidth <= unionWidth * 1.2 + 1` (was 1.5)
   - `viewBoxHeight <= unionHeight * 1.2 + 1`
   - Peering pair center distance ≤ `max(180, 2.5 × max(nodeW, nodeH))` (was 280 / 3.5)
3. On failure, attach `svg.outerHTML` (existing pattern).
4. One-line doc update under the IDL-06 section: sparse-peering ratchet now asserts gap ratio and 8/11 visible nodes.

## Acceptance criteria

- Test **fails** on trunk before IDT-01+02 (loose fixture / one `~~~`).
- Test **passes** after IDT-01+02 merged.
- Peer-grid and legacy-chain tests unchanged (do not lower their thresholds).

## Constraints

- **Do not** change viewer or backend code in this prompt.
- Verification: `cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout -g sparse`
