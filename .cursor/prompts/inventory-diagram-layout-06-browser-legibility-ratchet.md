# IDL-06 — Mock-backed browser ratchet for inventory diagram legibility

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** IDL-01–04 landed. Run last.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A Playwright spec that renders the **real** Inventory diagrams page with a mocked infra-evidence Mermaid API and fails when the diagram is illegible, clipped, or dishonest. Vitest/jsdom cannot measure layout; three waves (IDV, IDC, IDL) were each diagnosed from owner screenshots because nothing in CI paints the page.

## Why

2026-09-12 reproduction harness (outside the repo) drove `next dev` + `page.route` mocks and measured `g.node` `getBoundingClientRect()` against the viewport. It caught: 6 px labels at fit, `max-width:100%` zoom cap, and a crop that clipped a grid row — none of which any existing test can see. Turn that harness into a spec.

## Context

- `archlucid-ui/e2e/infra-evidence-hub-handoff.mock.spec.ts` — existing `page.route("**/api/proxy/v1/infra-evidence/snapshots**")` pattern
- `archlucid-ui/playwright.operator-mock.config.ts` — full operator shell project (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`, `MOCK_AUTH_ME_ROLE`)
- `archlucid-ui/e2e/start-e2e-with-mock.ts`, `e2e/mock-archlucid-api-server.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-types.ts` — `InfraEvidenceMermaidRenderResponse` shape for the fixture
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — test ids `architecture-diagram-viewport`, `architecture-diagram-svg-host`
- Route: `/governance/infrastructure/diagrams?snapshotId=…&mermaidMode=executive[&diagZoom=…]`

## What to build

1. `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts`: typed builders for three Mermaid sources with matching `metrics`:
   - `elevenVnetPeerGrid()` — 11 VNet nodes, IDL-02 grid `~~~` links, `%% al-*` comments, `edgeCount: 0`.
   - `elevenVnetChainLegacy()` — 10 `-->` chain edges (regression shape).
   - `wideGridTwentyFour()` — 24 nodes, 6 columns.
2. `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` (tag `@release-gate`), added to `playwright.operator-mock.config.ts` `testMatch`. Per fixture, at 1440 × 1400:
   - **Legibility:** every `g.node` box height ≥ `MERMAID_MIN_LEGIBLE_LABEL_FONT_PX × 1.6` px at default zoom (import the constant).
   - **No clipping:** every node box lies inside the SVG's bounding rect; SVG rect lies inside `viewport.scrollWidth × scrollHeight`.
   - **Width use:** union of node boxes spans ≥ 50% of viewport `clientWidth` for the grid fixtures.
   - **Honesty:** with `elevenVnetPeerGrid`, Edges table (`InfraEvidenceDiagramOutline`) has 0 rows and no `path` in `g.edgePaths` is visible (`getComputedStyle(...).visibility !== 'visible'` or stroke `none`).
   - **Isotropic zoom:** navigate with `diagZoom=2`; node box width and height are each within 5% of 2× the default-zoom box.
   - **Scroll not shrink:** `elevenVnetChainLegacy` still renders labels ≥ floor and `viewport.scrollHeight > clientHeight`.
3. Save a viewport screenshot per fixture to `test-results/` on failure (Playwright default) and attach `svg.outerHTML` via `testInfo.attach` for triage.
4. Document in `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md` how to run it locally: `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout` after a build, and note that `page.goto` must use the same origin the dev/standalone server logs (a `127.0.0.1` vs `localhost` mismatch triggers the Next dev-origin block and reload loop).

## Acceptance criteria

- Spec passes on trunk with IDL-01–04 merged; fails when `MERMAID_VIEWPORT_MIN_FIT_SCALE` is set to 0 or `svg.style.maxWidth = "100%"` is reintroduced (verify both by temporary local edits, then revert).
- Runtime under 60 s for the three fixtures.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change viewer or backend code; if an assertion fails on trunk, report which IDL prompt regressed instead of loosening the threshold.
- **Do not** add the spec to the buyer-polished `playwright.mock.config.ts` (demo flags hide the operator route).
- TB-645 vocabulary. Sentence case.
- Verification: this spec only, via the operator-mock config. Requires `npm run build` once (or `MOCK_E2E_SKIP_NEXT_BUILD=1` with an existing standalone build). Report runtime.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
