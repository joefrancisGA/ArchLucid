# DFV-17 — Filter data-flow edges by where the evidence came from

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-12, DFV-20, or DFV-21 in this session. If DFV-16 is already on `master`, the stage-count line must follow the edges that remain. Do not add that line in this session if it is absent.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after the Source column is readable enough to judge edges. Prefer DFV-12 first. Follow the existing `includeCrossGroupFanOut` checkbox. Do not add a workspace tab. Do not change the DFV-14 rollup rule.

## Goal

On **Data flow — what may connect**, four checkboxes can hide edges by evidence: Observed, App settings, From config, and Inferred. All four start checked. Unconnected cards stay on the canvas, and their `Used by N` line follows the edges that remain.

## Why

The canvas mixes ADF links, hostname guesses, confirmed config, and observed routes. `DiagramsWorkbenchClient` already has one checkbox, Show cross-group links, wired through `infra-evidence-diagrams-filter-url.ts` and the mermaid query. There is no way to look at only the declared edges.

`AzureInventoryDataFlowEvidenceCatalog` already assigns each association a family and an inference source. This session filters those edges before layout so the columns, the summary line, and the consumer counts match what is visible.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSnapshotsController.cs` (`includeCrossGroupFanOut`)
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `dfv/17-evidence-filters` from current `master`.
2. Add four query flags, defaulting to included: `includeObservedEvidence`, `includeAppSettingEvidence`, `includeConfigEvidence`, `includeInferredEvidence`. Parse them the way `includeCrossGroupFanOut` is parsed. Show the checkboxes on the data-flow diagram only, in the same row as Show cross-group links.
3. Map edges with the catalog and inference source:
   - **Observed:** `DeclaredMovement`, `ObservedRuntime`, `AuthorizedAccess`, `StructuralNetworkPath`, except the app-setting and config sources below.
   - **App settings:** inference sources `inventory-hostname-inferred-target` and `inventory-app-key-vault-ref`.
   - **From config:** inference sources `inventory-operator-confirmed-connection` and `inventory-operator-config-file` when that constant exists. A build that does not have the config constant yet still filters `inventory-operator-confirmed-connection`.
   - **Inferred:** `inventory-adf-linked-service-inferred` and `inventory-synapse-linked-service-inferred`.
4. An unchecked box removes those edges before column layout and before the consumer count. Cards with no remaining edge stay, and the consumer line becomes `No consumer found` or `No evidence checked` under the rule already on the canvas.
5. The PNG export receives the same four flags. A filtered on-screen diagram exports the filtered picture.
6. Other diagram types ignore the flags and do not show the checkboxes.
7. Tests:
    - With inferred off, an `inventory-adf-linked-service-inferred` edge is absent and a declared ADF `uses` edge remains.
    - With app settings off, a hostname-inferred edge is absent.
    - With all four on, the edge set matches today's data-flow canvas.
    - A storage card whose only edge was inferred shows `No consumer found` when inferred is off and the snapshot still has other evidence.
    - The diagrams URL round-trips a cleared checkbox.
    - Full subscription does not show the four checkboxes.

## Acceptance criteria

- Data flow can show or hide each of the four evidence groups.
- The default picture matches the current canvas.
- Consumer counts follow the visible edges.
- The checkboxes do not appear on other diagram types.
- Workspace tabs are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not remove an evidence family from the catalog. A hidden edge is filtered for that request only.
- Working-tree safety. Stage only the filter, the query flags, the checkbox row, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DataFlow|FullyQualifiedName~Evidence"
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter FullyQualifiedName~Mermaid
```

```powershell
cd archlucid-ui
npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

Run the Vitest files that exist. Heartbeat every 8s on the dotnet compile:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'
```

One compile, plus one retry if it exits 1. If that project is too broad, compile `ArchLucid.ArtifactSynthesis` instead and say so.

## Done when

Tests pass. Tell the owner to restart the API and the UI, then open Data flow. Four checked boxes should sit with Show cross-group links, and clearing Inferred should drop the `Likely connected to` ADF links while declared edges remain. Export PNG should match the filtered canvas. Wait for that look before any commit.
