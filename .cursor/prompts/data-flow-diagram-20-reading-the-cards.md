# DFV-20 — Say what the lines on a data-flow card mean

**Model:** Composer 2.5. Paste this file as the whole task. Do not send it to Luna. Do not implement DFV-12, DFV-16, DFV-17, or DFV-21 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Page chrome only. Do not change SVG cards, stage headers, rollup, or the honesty legend in `DiagramDataFlowHonestyLegend`.

## Goal

On **Data flow — what may connect**, a short helper sits under the existing mode caption. It tells the reader what the lines on a card are. Other diagram types do not show it.

## Why

The owner can read the words on the cards and still cannot tell which line is the name, which line is the type, and which line is a status. The workbench already says what the diagram is. `infraDiagramModeJobCaption` returns `This diagram shows what may connect. It is not observed traffic.` for `dataFlow`. That sentence does not explain the card. The honesty legend in the disclosure stays as it is. This session does not rewrite "Reads from / Writes to" or the pipeline-direction warning.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`infraDiagramModeJobCaption`, both call sites)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `dfv/20-reading-the-cards` from current `master`.
2. For `dataFlow` only, render a second helper paragraph immediately under the existing mode caption, in both places that already render `infraDiagramModeJobCaption`.
3. Use this sentence, unchanged:

   `Reading a card: the first line is the name. The next line is the type. Used by N or No consumer found says whether a store has a consumer. Factory, host, and runtime lines describe a Data Factory link.`

4. Keep the existing caption `This diagram shows what may connect. It is not observed traffic.`
5. Data architecture and every other diagram type stay one caption or none. Do not add the reading sentence there.
6. Do not paint this sentence into the SVG, the PNG, or `DiagramDataFlowHonestyLegend`.
7. Tests: the data-flow workbench shows both sentences. A non-data-flow mode does not show `Reading a card`.

## Acceptance criteria

- Data flow shows the existing caption and the reading sentence under it.
- Other diagram types do not show the reading sentence.
- Card pixels, stage headers, and the honesty disclosure are unchanged.
- Workspace tabs are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not rename stages or hide cards.
- Working-tree safety. Stage only the workbench caption and its test. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

## Done when

The test passes. Tell the owner to open Data flow on `Hmd_HI_HAP_Non_Prod`. Under the diagram type, the page should still say this is not observed traffic, and the next line should say how to read a card. The picture itself should look the same. Wait for that look before any commit.
