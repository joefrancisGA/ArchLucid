# IDX-13 — Cross-mode forest / Mermaid / PNG ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-01–12 merged (or land failing tests only for merged slices). **Do not** implement new visuals.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Automated tests fail if any of the twelve `DiagramMode` values regress on the excellence contract: hidden PEs by default, cited hops not cliques, honest verbs, nested VNet frames when members exist, subscription outer only on subscription-scoped modes, DataFlow stages not replaced by RG-first packing, PNG clusters matching forest, neighborhood node count below Full subscription.

## Why

Prior waves tested Full subscription or Network mermaid only. Identity skipped compose. DataFlow skipped the lifter. PNG lagged forest (IDA-08 / IDF-06 history). The next agent will “fix” one mode and break the rest.

## Applies to every `DiagramMode`

Member-data / theory tests **must** iterate:

`Executive`, `Architecture`, `Network`, `Security`, `Identity`, `Data`, `DataFlow`, `DataArchitecture`, `FullSubscription`, `ResourceGroup`, `SelectedResources`, `DependencyNeighborhood`.

Skip assertions that require nodes the mode filter removes — but the skip must be explicit (`Assert.Skip` / `return` with comment), not a swallowed empty AST.

## What to build

1. Shared test fixture (own file): one snapshot graph with VM, NIC, subnet, VNet, PE, Logic App + cited connection, duplicate Office365 connection, peering, Key Vault, ADF, identity node, two singleton RGs + two fat RGs, diagnostic id.

2. Ratchet assertions (own helper file) parameterized by mode:

   | Contract | Assert |
   |----------|--------|
   | Default PE | 0 PE nodes unless `IncludePrivateEndpointNodes` |
   | Default NIC | 0 NIC nodes |
   | Cited vs clique | Logic App edges ≤ cited connection count |
   | Verbs | If peering endpoints visible → label contains `peering`; contains/in not overwritten to `connects` |
   | Nested frames | Network + any mode with VNet members → VNet frame/cluster present; Identity without network → 0 VNet frames |
   | Subscription outer | Present for Full/Executive/Network/…; absent for ResourceGroup/Selected/Neighborhood |
   | DataFlow | Stage subgraph ids still present |
   | DataArchitecture | Type-group subgraphs still present |
   | PNG | DOT `cluster_` for RG; nested/subscription when forest has them for that mode |
   | Neighborhood | Node count < FullSubscription node count on the fat fixture |
   | Completeness | Payload includes `hiddenHopsUsedCount` when hops composed |

3. Vitest: workbench PE toggle default off; completeness strip renders `missingClasses`.

4. Do **not** retune Mermaid gaps to make Playwright pass. Optional Playwright only if an existing `infra-diagrams-layout` mock already covers forest frames — extend, do not new a flaky live Azure test.

## Acceptance criteria

- Filter names in the paste file’s test command cover ArtifactSynthesis + Application + focused Vitest.
- No new production visuals.

## Constraints

- **This is not IDX-HOLD.** If a session starts a complete graph to make counts rise, stop and paste HOLD.

## Done when

`dotnet test --filter FullyQualifiedName~InventoryDiagramExcellence` (or the name you lock) fails when Identity skips compose or ResourceGroup grows a subscription outer frame.
