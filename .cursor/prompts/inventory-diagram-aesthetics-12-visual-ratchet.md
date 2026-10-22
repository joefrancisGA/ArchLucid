# IDA-12 — Aesthetics ratchet (palette, crossing, outline, PNG)

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-01–11 merged (or land failing tests only for merged slices — prefer after 01–11). **Do not** implement new visuals. **Do not** start IDA-HOLD items.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Automated tests fail if the inventory-forest canvas regresses to **honey node fills**, **uniform 400 px cards**, **peering pills on an all-peering component**, **straight edge lines through a third node** (when IDA-05 landed), **always-open outline on the workbench**, or **Graphviz fillcolor honey**. Playwright (or existing `chromium-infra-diagrams-layout` project) asserts the owner 11/6 forest is **neutral cards** at **100%** zoom.

## Why

IDA-01–11 are easy to revert by a later “put the brand gold back” or “restore uniform width” pass. `Render_owner_shape_executive_vnets_use_uniform_node_width` used to **protect the bad geometry**. This prompt is the replacement ratchet.

## Context

- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` + `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts`
- `docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd`
- IDH-03 job: `chromium-infra-diagrams-layout` on pull_request — **extend**, do not skip `pull_request`
- Vitest: outline + svg paint
- Do **not** re-run IDS-04 unmapped bbox.

## What to build

1. C# owner-shape (forest renderer, not Mermaid file alone):
   - No node-card fill `#D4A84B`.
   - No node-card width `400` (unless a single pathological name clamps — max is 280; assert `<= 280`).
   - If IDA-06 present: 0 `g.edge-label` for owner-shape; dashed paths.
   - If IDA-05 present: owner-shape edges are `path` not `g.edge > line`.
   - If IDA-09 present: `g.legend` exists.

2. Vitest:
   - `architecture-diagram-svg.test.ts` forbids honey on node-card after paint.
   - Outline default collapsed (IDA-10).

3. Playwright mock:
   - Serve forest `layoutSvg` **or** the packed owner mermaid if the mock still paints mermaid — prefer a **fixture SVG** snippet generated from a committed sample **or** assert computed style fill is not `rgb(212, 168, 75)` (`#D4A84B`).
   - Zoom 100 on the 11-node fixture (IDA-11 fits).
   - Outline Nodes table not visible until click.
   - Do not require screenshot goldens unless the repo already has them; prefer DOM/CSS asserts.

4. If `ui-playwright-mock-smoke` still skips `pull_request`, **do not** reopen that debate unless IDH-03 already runs the layout project on PR. Attach tests to that project’s path filters including `ArchLucid.ArtifactSynthesis/Layout/**` and `architecture-diagram-svg.ts`.

5. No product behavior beyond tests + tiny `data-testid="diagram-legend"` if the legend lacks a test id.

## Acceptance criteria

- CI fails if honey fills or 400 px uniform cards return on owner-shape forest.
- CI fails if workbench outline is expanded by default.
- Owner 11/6 mock still 11 visible at 100%.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDA-HOLD. **Do not** retune Mermaid gaps to make Playwright pass.
- Verification: forest renderer filter + `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx` and `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout` if that project exists. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
