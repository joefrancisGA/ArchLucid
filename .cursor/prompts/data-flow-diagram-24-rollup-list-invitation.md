# DFV-24 — Make the rolled-up member list obvious

**Model:** Composer 2.5. Paste this file as the whole task. Do not send it to Luna. Do not implement DFV-12, DFV-15, DFV-17, DFV-21, DFV-22, or DFV-23 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-14 and DFV-20. The member list already opens on click. This session only makes that click obvious. Do not change which cards roll up, the member rows, or the second-click close.

## Goal

On **Data flow — what may connect**, a card whose title is a count, such as `6 storage accounts`, tells the reader to click it. The click still lists every member. The open list is titled with that count. A second click still closes it.

## Why

DFV-14 already puts the names on `data-member-names` and `ArchitectureDiagramViewer` already renders them. The only mark on the card is a 10px corner `[1]`. **Reading a card** explains the name, the type, and **Used by N**, and never says that a count opens a list. After the click, the heading says `Showing connections for 6 storage accounts.`, which describes a different action. The owner looked at the picture, found the list acceptable, and could not tell it existed.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` (the `[ordinal]` text on `IsDataFlowRollup`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs` (`Measure` line count and width)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs` (PNG legend heading)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`Showing connections for`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`INFRA_DIAGRAM_DATA_FLOW_READING_CARD_CAPTION_REST`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `dfv/24-rollup-list-invitation` from current `master`.
2. On a data-flow rollup card only, paint one more line in the same 11px caption style as the type line, after the lines the card already has:

   `Click to list the {count}`

   `{count}` is the member count. A card of six members reads `Click to list the 6`. Rollup starts at four members, so do not add a singular sentence. Count this line in `Measure` so the card grows taller and wider enough to hold it. Do not clip it.
3. Remove the corner `[ordinal]` text from the on-screen card. Set `cursor="pointer"` on that rollup `g.node`. Leave every other card's cursor alone.
4. Keep the SVG `<title>` as the short card name, such as `6 storage accounts`. The click handler uses that title. Do not put the click sentence into the title, or the open heading becomes the sentence.
5. In **Reading a card**, keep the sentences already on the page. Append this sentence, unchanged:

   `A title that is a count, such as 6 storage accounts, opens the list of names. Click that card again to close the list.`

   The full helper stays under the existing mode caption, for `dataFlow` only. Do not paint it into the SVG or the honesty legend.
6. When the focused card has member names, the heading is the card title alone, such as `6 storage accounts`. Do not prefix it with `Showing connections for`. Keep the existing bullet list of name, resource group, and consumer line. A card with no member names still says `Showing connections for {name}.`
7. PNG export still lists every member. The legend heading for a rollup is the card title, such as `6 storage accounts`, without a `[1]` prefix. The on-screen SVG still does not repeat the member table under the legend.
8. Tests:
   - Five storage accounts in one rollup contain the text `Click to list the 5`. No text node on that card is `[1]`.
   - A card that is not a rollup does not contain `Click to list the`.
   - The data-flow workbench **Reading a card** paragraph includes the new sentence. Another diagram type does not.
   - A viewer click on a node with `data-member-names` and title `6 storage accounts` shows the heading `6 storage accounts` and the member lines, and does not show `Showing connections for` for that click.
   - An existing non-rollup click still shows `Showing connections for`.

## Acceptance criteria

- A count card says `Click to list the {count}` in the same size as the other caption lines.
- **Reading a card** says that a count opens the list and that a second click closes it.
- The open list is titled with the count. The member lines are the ones DFV-14 already builds.
- Grouping, icons, stage headers, and workspace tabs stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change the rollup threshold, the neighbor rule, or `data-member-ids` / `data-member-names`.
- Do not add a tab, a route, a modal, or a second diagram mode.
- Working-tree safety. Stage only the rollup invitation line, the reading-card sentence, the open-list heading, the PNG legend heading, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForestLayoutSvgRendererTests"
```

```powershell
cd archlucid-ui
npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx src/components/architecture/ArchitectureDiagramViewer.test.tsx
```

Heartbeat every 8s on the dotnet test:

```powershell
$intervalSec = 8
$repoRoot = (Get-Location).Path
$job = Start-Job -ScriptBlock {
  param($Root)
  Set-StrictMode -Version Latest
  Set-Location -LiteralPath $Root
  dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForestLayoutSvgRendererTests"
  exit $LASTEXITCODE
} -ArgumentList $repoRoot
try {
  while ($job.State -eq 'Running') {
    Write-Host ("STILL EXECUTING... {0}" -f (Get-Date -Format 'HH:mm:ss'))
    Start-Sleep -Seconds $intervalSec
  }
  $output = Receive-Job $job -Wait -AutoRemoveJob
  if ($null -ne $output) { $output | ForEach-Object { Write-Host $_ } }
  if ($job.JobStateInfo.State -eq 'Failed') {
    $reason = $job.ChildJobs[0].JobStateInfo.Reason
    if ($null -ne $reason) { Write-Error $reason }
    exit 1
  }
  exit 0
}
finally {
  if ($job.State -eq 'Running') {
    Stop-Job $job -Force
    Remove-Job $job -Force
  }
}
```

## Done when

The tests pass. Tell the owner to open Data flow and look at a card such as `6 storage accounts`. The card should say `Click to list the 6`. **Reading a card** should say a count opens the list. A click should title the list `6 storage accounts` and show the same member lines as today. A second click should close it. Wait for that look before any commit.
