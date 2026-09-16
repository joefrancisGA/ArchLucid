# IDF-04 — Frame-aware cell chrome (space between boxes)

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-02 (label band exists). Prefer after IDF-03 so review sees the gap on the final ink. **Do not** implement crop, Graphviz, or IDF-05–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`ComponentHorizontalGap` (48) and `ComponentVerticalGap` (40) become **true gutters between frame borders**, not between node cards. Frame pad and label band are **charged to the cell**. Owner-requested “a little space” appears without raising those global constants.

## Why

IDA-08 draws the frame as node-union **plus 12 px after placement**. Adjacent framed cells therefore share 48 − 24 = 24 px horizontally and 40 − 24 = **16 px** vertically — not enough for two 2 px strokes plus labels. Bumping 48/40 would fight `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` (`viewBoxToUnion*` ≤ 1.2, `maxHorizontalGapRatio` ≤ 0.75) and the IDT/IDG compact-forest hold. Charging chrome to framed cells only keeps unframed singletons tight.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `LayoutComponentInterior` / `PlaceNodes` / `BuildComponentLayouts` use cell width/height from **node** union
- `DiagramForestLayoutOptions.cs` — `ComponentHorizontalGap` 48, `ComponentVerticalGap` 40, `Padding` 16
- Named `ResourceGroupFramePad` / `ResourceGroupFrameLabelBand` from IDF-02
- Playwright: `archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts` — **do not** retune Mermaid `nodeSpacing` to pass; if forest viewBox grows, keep owner 11-VNet (often **0** frames) passing at 100%

**Do not** change `ComponentHorizontalGap` / `ComponentVerticalGap` / Mermaid `padding`. **Do not** merge split RGs across components (IDF-01).

## What to build

1. When measuring a **framed** cell (named group, ≥ 2 members):
   - Inner layout (TD / LR / hub-spoke) unchanged.
   - Cell width = node union width + `2 * ResourceGroupFramePad`.
   - Cell height = label band + node union height + `ResourceGroupFramePad` (top band already includes top pad; do not triple-count — document the arithmetic in a comment).
   - Place member nodes **inside** that box (offset X/Y by pad / band).
   - Frame rect **equals** the cell box (or inset 0.5 px), not a second inflate.

2. Ungrouped / singleton cells: **no** extra chrome. Same gaps as today.

3. Adjacent framed cells: distance between frame borders equals `ComponentHorizontalGap` / `ComponentVerticalGap` (assert ±1 px in tests).

4. Tests:
   - Two framed cells side by side: `frameB.X >= frameA.X + frameA.Width + ComponentHorizontalGap - 1`.
   - Two framed cells stacked: same with `ComponentVerticalGap`.
   - Mixed row (framed + singleton): singleton not padded as if framed; no overlap.
   - Owner-shape 11 VNets (0 frames): viewBox / packing tests unchanged.
   - Do **not** weaken Playwright `viewBoxToUnion` caps.

5. If a test fixture becomes overlapping because chrome was added only on paint: **fix layout**, do not shrink pad below IDF-02.

## Acceptance criteria

- Neighboring RG boxes have a visible gap equal to the existing component gaps.
- Unframed cards stay as compact as IDA-04.
- Dense 11-VNet owner mock still fits the locked camera.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-05–07. **Do not** retune Mermaid gaps. **Do not** raise `ComponentHorizontalGap` / `ComponentVerticalGap`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'`. If `chromium-infra-diagrams-layout` is cheap to run: `cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
