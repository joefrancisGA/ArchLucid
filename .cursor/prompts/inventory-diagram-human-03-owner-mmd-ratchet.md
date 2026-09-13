# IDH-03 — Owner `.mmd` Playwright ratchet that actually runs on PRs

**Wave:** inventory-diagram-human (**IDH**). **Depends on:** IDH-01 merged (emission) and IDH-02 (camera). Run last.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A Playwright spec that paints **the owner export** (and the IDH-01 packed form of the same six peerings) and **fails** when the canvas is not a human-readable forest. Geometry must use **mapped** node boxes. The job must run on **pull_request** when the packer, viewer camera, fixture, or this spec changes.

## Why

IDS-04 (`infra-diagrams-layout.mock.spec.ts` sparse-peering case) is vacuous:

- `getBBox()` is unmapped → `unionWidth ≈ 273` for any layout of this graph.
- Node lookup `flowchart-${id}-0` and `/L_([^_]+)_([^_]+)_/` do not match Mermaid 11.17 ids (`{renderId}-flowchart-n_{hash}-{n}`, path id `{renderId}-L_n_{from}_n_{to}_0`).
- Pair-distance loop therefore collects **zero** pairs.
- `ui-playwright-mock-smoke` is `if: github.event_name != 'pull_request'`. IDS PRs skipped it.

The fixture must be the owner file, not a hand-wavy 11-label chain.

## Context

- `docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd` — **unpacked** owner export (copy into `archlucid-ui/e2e/fixtures/` or import via a comment + duplicated string; do not fetch at runtime)
- After IDH-01, `elevenVnetSparsePeeringMermaid()` must be the **compiler/renderer golden** (0 `alpack`, `~~~` row links, six visible `-->`). Keep a second helper `elevenVnetOwnerExportMermaid()` that is the raw export for a “pre-pack paint” case if useful — default the main case to **post-IDH-01** emission.
- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts`
- `archlucid-ui/playwright.operator-mock.config.ts` — project `chromium-infra-diagrams-layout` already matches this spec
- `.github/workflows/ci.yml` — `ui-playwright-mock-smoke` skips PRs; `npm run test:e2e:mock:operator-shell` is the command that includes this project **after** an operator-shell rebuild

## What to build

1. Replace `elevenVnetSparsePeeringMermaid()` so it does **not** contain `subgraph alpack`. Source of truth: render the owner-shape graph through `MermaidDiagramRenderer` in a .NET test and paste the golden, **or** take the owner `.mmd` and append the IDH-01 `~~~` lines. Document which. Metrics: 11 nodes, 6 visible edges, 0 subgraphs.

2. In the sparse-peering Playwright case, measure with **mapped** boxes (copy the `getCTM` / `createSVGPoint` pattern). Parse node ids with `/flowchart-(n_[0-9a-f]+)-\d+$/` and edge ids with `/L_(n_[0-9a-f]+)_(n_[0-9a-f]+)_\d+$/` (allow the render-id prefix). Skip `edge-thickness-invisible` paths when counting peering distance.

3. Assertions (1440×1400 viewport, default zoom, no `diagZoom` query):
   - Zoom input is `100` (or empty-URL default 100).
   - `g.node` count === 11.
   - Visible nodes (≥50% area inside `.architecture-diagram-viewport`) **≥ 9**.
   - Mapped viewBox aspect (`width/height`) **≤ 2.5**.
   - `fitScale` equivalent: no horizontal scrollbar (`scrollWidth <= clientWidth + 2`) at 100%.
   - Outline Edges `tbody tr` length === 6.
   - Min node height ≥ `MERMAID_MIN_LEGIBLE_LABEL_FONT_PX × 1.6`.
   - Each visible peering pair center-distance ≤ `max(280, 3.5 × max(nodeW, nodeH))` using **mapped** centers.
   - Mermaid source in the DOM (or export control) must **not** include `subgraph alpack`.
   - On failure: `testInfo.attach` `svg.outerHTML`.

4. Keep IDL-06 zero-edge grid and legacy-chain tests. Do not lower their thresholds.

5. CI: add a **pull_request** job (or drop the `pull_request` exclusion for a **path-filtered** job) that runs:

   `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout`

   after the operator-shell `npm run build` (same env as today's operator-shell step). Path filter: `ArchLucid.ArtifactSynthesis/**`, `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts`, `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts`, `archlucid-ui/src/lib/help/help-mermaid.ts`, `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts`, `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`. Do **not** enable the full buyer mock suite on every PR.

6. One paragraph in `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`: command + “mapped bbox, owner `.mmd`”.

## Acceptance criteria

- Spec **fails** if someone reintroduces `alpack_*` wrapping (wide LR pairs).
- Spec **passes** on IDH-01 packed owner topology at 100% zoom.
- A pull_request that only touches the packer or this spec runs this project (not skipped).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change packer or viewer behaviour here except test/CI. If the spec fails after 01–02, report which prompt regressed; do not loosen visible-count below 9 or aspect above 2.5.
- Do not add this spec to `playwright.mock.config.ts` (buyer demo flags hide the operator route).
- Verification: from `archlucid-ui/`, operator-shell build if needed, then the Playwright command above. Report runtime. Heartbeat every 8s if >15s. No full-solution `dotnet` build beyond what 01 already ran.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
