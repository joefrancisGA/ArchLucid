# DFV-19 — Fix the data-flow PNG browser fallback

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-15, DFV-16, or DFV-17 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-14. Do not change rollup grouping, column wrap, or the live canvas.

## Goal

On **Data flow — what may connect**, **Export PNG** completes when the server rasterizer is unavailable. The browser fallback draws the diagram and, when rollup cards exist, lists their members under the picture. The page no longer shows `SVG_NS is not defined`.

## Why

The owner clicked **Export PNG** on snapshot `Hmd_HI_HAP_Non_Prod`, diagram type **Data flow — what may connect**. The page showed:

`Could not download diagram PNG — SVG_NS is not defined`

The recovery text says server-side PNG rendering is unavailable in that environment, so the UI used the browser fallback. `appendDataFlowRollupMemberLegend` in `archlucid-ui/src/lib/infra-evidence/export-mermaid-source-to-png.ts` calls `parsed.createElementNS(SVG_NS, ...)`. That file does not declare `SVG_NS`. The same string already exists as a private constant in `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts`. The `ReferenceError` stops the fallback before a PNG blob is created.

The live diagram still paints. This session fixes the fallback only.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `archlucid-ui/src/lib/infra-evidence/export-mermaid-source-to-png.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` (`SVG_NS`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-api.ts` (`downloadInfraEvidenceMermaidPng`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (the PNG fallback failure sentence)

## What to build

1. Branch `dfv/19-png-fallback-namespace` from current `master`.
2. In `export-mermaid-source-to-png.ts`, define the SVG namespace in that file: `http://www.w3.org/2000/svg`. Use it for every `createElementNS` call in `appendDataFlowRollupMemberLegend`. Do not import the private constant from the sanitizer.
3. Keep the member legend behavior. A rollup `g.node` with `data-member-names` still adds `[n] {title}` and one line per member, and the viewBox grows to include that block. An SVG with no rollup node is returned unchanged.
4. A missing server rasterizer stays a fallback, not a new error. Do not change Graphviz, the PNG API, or the "server PNG is unavailable" copy except where a test string must match the thrown error disappearing.
5. Tests:
    - A fixture SVG with one rollup node, `data-member-names="acct-a · rg-a · No consumer found|acct-b · rg-b · Used by 1"`, and a finite `viewBox` produces markup that contains both member lines and `rollup-member-legend`.
    - The same call does not throw `SVG_NS is not defined`.
    - A fixture SVG with no `data-member-names` is unchanged apart from the existing sanitizer pass.
6. Export the legend helper if that is the smallest way to test it without rasterizing a canvas. Do not add a browser screenshot test.

## Acceptance criteria

- Export PNG on a data-flow canvas with rollup cards no longer fails with `SVG_NS is not defined`.
- The browser PNG includes the rollup member names when the server rasterizer is unavailable.
- A diagram with no rollup cards still exports through the same fallback.
- The on-screen data-flow canvas is unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not redo DFV-14 rollup rules. Do not collect app settings. That is DFV-15.
- Do not add a workspace tab or a second diagram mode.
- Working-tree safety. Stage only the PNG fallback helper and its test. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/infra-evidence/export-mermaid-source-to-png.test.ts
```

If that test file is new, run it by the path you created. Heartbeat every 8s. One run, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the UI and open Data flow on `Hmd_HI_HAP_Non_Prod`. **Export PNG** should download a file. If the server rasterizer is still unavailable, the browser fallback should succeed and the error banner should stay gone. A rollup such as storage accounts should list its members in that PNG. Wait for that download before any commit.
