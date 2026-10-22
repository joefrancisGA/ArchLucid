# DFV-14 — Roll up repeated cards and keep a way to read each one

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-13 or DFV-15 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-13 may already have wrapped the columns. This session must work whether or not that wrap has landed. Do not redo executive overflow.

## Goal

On **Data flow — what may connect**, more than three cards that are the same kind, in the same stage, and tied to the same neighbors become one stacked card such as `14 storage accounts` with `3 used · 11 no consumer found`. A click lists every member. The PNG export lists every member under the legend, because a PNG cannot be clicked.

## Why

The storage column is dozens of accounts that share a type and often share "no consumer." Drawing each one is accurate and hard to read. The owner will accept a single card for a repeated group when the names remain available.

`DiagramExecutiveAlwaysShowSelector` already builds `+N more` nodes for the executive diagram. Those nodes drop ARM metadata and do not expand. Do not send data-flow cards through that selector.

`ArchitectureDiagramViewer` already focuses a `g.node` on click. `sanitizeArchitectureDiagramSvg` keeps `data-*` attributes only when they are listed in `ADD_ATTR`. The PNG endpoint renders the same forest SVG through a separate export call.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramExecutiveAlwaysShowSelector.cs` — read only, do not call it from Data flow
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` (`ADD_ATTR`)
- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `dfv/14-rollup-repeated-cards` from current `master`.
2. On a data-flow canvas only, group nodes whose stage, type, and sorted set of neighbor ids are equal. Type is `ExternalLinkedServiceType` when set, otherwise `ArmResourceType`. A group of 3 or fewer stays as separate cards. A group whose members have different neighbor sets stays as separate cards.
3. Replace a larger group with one card:
   - Title `14 storage accounts`, `6 Function Apps`, `5 Logic App connections`, or `{N} {type caption}` for any other type.
   - When the members have consumer lines, a second line `{used} used · {none} no consumer found`.
   - The same official icon as one member, with the product words in the title. Access connectors and Fabric capacity stay pictograms.
4. On the rollup `g.node`, set `data-member-ids` to the member node ids and `data-member-names` to the display names, resource groups, and consumer lines, separated so the click handler can split them. Add both attributes to `ADD_ATTR` in `sanitizeArchitectureDiagramSvg`. Put a short `[1]` marker on the card, one number per rollup.
5. Clicking that card uses the existing focus control in `ArchitectureDiagramViewer`. The focus content lists every member name, resource group, and consumer line. Clicking the same card again clears focus, as it does today. Do not add a workspace tab, a route, or a second diagram mode.
6. The live SVG does not repeat that member table under the legend. The PNG export path asks the renderer for the table: under the legend, `[1] 14 storage accounts` and one line per member with name, resource group, and status. Pass a flag into the existing forest renderer from the PNG export. The on-screen render leaves the flag off.
7. Tests:
    - Five storage accounts in Storage with no edges become one card whose SVG text contains `5 storage accounts` and `0 used · 5 no consumer found`.
    - Two of those five, given different neighbors, stay outside the rollup.
    - Three storage accounts stay three cards.
    - The export SVG contains the member names. The on-screen SVG does not contain the legend table.
    - A sanitized SVG still has `data-member-ids`.
    - A Full subscription canvas does not gain a rollup card.

## Acceptance criteria

- Repeated same-neighbor cards above three become one card.
- The live diagram lists members when the card is clicked.
- The PNG lists members under the legend.
- Cards that connect to different things stay individual.
- Workspace tabs stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download an icon pack. Do not borrow a Databricks icon for an access connector.
- Working-tree safety. Stage only the data-flow rollup, the SVG attributes, the viewer focus list, the sanitizer allowlist, the export flag, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~DataFlow"
```

```powershell
cd archlucid-ui
npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx
```

Run the Vitest files that exist. If a test file name differs, run the nearest existing test for the sanitizer and the viewer. Heartbeat every 8s on the dotnet compile:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and the UI, then open Data flow on `Hmd_HI_HAP_Non_Prod`. A run of similar storage accounts with the same connections should be one card. Clicking it should list the account names. Export PNG should show those names under the legend. A storage account that connects to a different factory should still be its own card. Wait for that look before any commit.
