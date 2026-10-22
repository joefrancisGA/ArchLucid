# DFV-16 — Put a one-line summary on the data-flow canvas

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-12, DFV-17, DFV-20, or DFV-21 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-13, DFV-14, DFV-18, and DFV-19. Do not redo column wrap, horizontal scroll, rollup, or the PNG fallback. Count the cards the canvas is about to paint. A DFV-14 rollup counts as one card. Do not also count its hidden members.

## Goal

On **Data flow — what may connect**, one line above the stage columns states how many cards sit in each stage. The Storage stage also states how many are used and how many have no consumer. The PNG export shows the same line.

## Why

The stage headers already name Source, Application, Ingestion, Storage, Transform, and Consumer. On snapshot `Hmd_HI_HAP_Non_Prod` the left side is still dense, and a reviewer has to scan the columns to learn that storage is large and mostly unconnected. `DiagramForestDataFlowStageLabelSvgEmitter` paints the headers and nothing above them. This line is counts only. It does not explain what the lines on a card mean. That helper is DFV-20.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowStageLabelSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`

## What to build

1. Branch `dfv/16-stage-summary` from current `master`.
2. On a data-flow canvas only, paint one SVG text line above the stage labels, using the stage labels the headers already use. Join the stages that have at least one card with ` → `.
3. For the Storage stage, when consumer lines exist, append ` ({used} used, {none} no consumer found)` or ` ({used} used, {none} no evidence checked)` using whichever phrase the cards actually show. Count cards, so a DFV-14 rollup counts as one card. Do not also count its hidden members.
4. When a Not staged column has cards, end the line with ` · {n} not staged`.
5. An empty stage is absent from the line. A diagram with one stage is still one line, with no arrow.
6. The line is ordinary SVG text, so the PNG export includes it. Do not add a "Reading a card" sentence in the page chrome. That is DFV-20.
7. Tests:
    - Two source cards, one ingestion card, three storage cards (one `Used by 1`, two `No consumer found`), and one consumer card render `2 Source → 1 Ingestion → 3 Storage (1 used, 2 no consumer found) → 1 Consumer`, or the same words with the header capitalization the stage labels already use.
    - A Full subscription canvas does not contain `no consumer found` from this line.
    - A data-flow canvas with a Not staged card ends with `not staged`.

## Acceptance criteria

- The data-flow canvas opens with a count of each stage that has cards.
- Storage states used and not used.
- Other diagram types do not gain the line.
- The PNG shows the line.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not hide cards to make the counts smaller.
- Working-tree safety. Stage only the summary emitter, the data-flow renderer call, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~DataFlow"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. A single line above the columns should give the stage counts, including how many storage cards are used. Export PNG should show that line. Wait for that look before any commit.
