# IDF-07 — Resource-group frame visibility ratchet

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-01–06 merged (or land failing tests only for merged slices — prefer after 01–06). **Do not** implement new visuals. **Do not** start IDF-HOLD items.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Automated tests fail if inventory-forest RG frames regress to **name-wide overlapping AABBs**, **1 px `#94a3b8` `5 4` strokes**, **labels outside the rect**, **node-only crop that clips `g.rg-frame`**, or **PNG DOT without `cluster_`** for a two-node RG.

## Why

IDA-08’s only frame test counts `g.rg-frame` and caption suppression. A later “restore dashed 5 4” or `ResolveFrameBounds` name union would go green. This prompt is the replacement ratchet.

## Context

- `ArchLucid.ArtifactSynthesis.Tests/DiagramResourceGroupPackerTests.cs` (IDF-01)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstGraphvizDotEmitterTests.cs`
- `archlucid-ui/src/lib/help/help-mermaid.test.ts` (IDF-05)
- `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` + fixtures
- IDH-03 job `chromium-infra-diagrams-layout` on pull_request — **extend**, do not skip `pull_request`

## What to build

1. C# (forest):
   - Split-RG fixture: frame count **2**, AABB overlap **false**.
   - Framed `g.rg-frame > rect`: `stroke-width` **2**, `stroke` **`#64748b`**, **no** `stroke-dasharray="5 4"`, `fill="#f1f5f9"`.
   - Label `text` `y` > frame `rect` `y`.
   - Adjacent framed cells: gap ≥ `ComponentHorizontalGap` / `ComponentVerticalGap` minus 1 px (IDF-04).
   - Owner-shape without RG: **0** frames (do not fail IDA-12 honey/400 ratchets).

2. C# (DOT, if IDF-06 merged): two-node RG emits `penwidth=2` cluster; split-RG emits two clusters.

3. Vitest: crop union includes `g.rg-frame` (IDF-05 case stays).

4. Playwright: small forest `layoutSvg` mock with two adjacent frames — both `g.rg-frame` boxes visible in the camera (not `display:none`, bbox inside viewport). Do not require screenshot goldens. Do not retune Mermaid gaps to pass.

5. No product behavior beyond tests + `data-testid="rg-frame"` only if Playwright cannot select `g.rg-frame` (prefer the class that already exists).

## Acceptance criteria

- CI fails if name-union overlap returns.
- CI fails if frame stroke returns to 1 px dashed `#94a3b8`.
- CI fails if crop ignores frames.
- 11-VNet owner mock still 11 visible at 100% with 0 frames.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-HOLD. **Do not** retune Mermaid gaps to make Playwright pass.
- Verification: forest/packer/DOT filters + `cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts` and `MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout` if that project exists. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
