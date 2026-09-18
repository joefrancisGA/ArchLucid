# AX-DC-02 — Authorization / connection endpoint inclusion

**Wave:** AX-DC. **Depends on:** AX-DC-01 (docs); AX-DE-03 shipped. **Do not** add collectors.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

When a mode filter would drop a node, **still include both endpoints** of high-value connection edges so **May access**, **Sends diagnostics to**, **Likely connected to**, and proven PE / Service Connector links paint on Executive, Identity, and Data modes — without opening the full subscription forest.

## Why

`DiagramAstFromGraphCompiler` drops any edge whose `FromNodeId` or `ToNodeId` is not in the filtered node set. Executive `DiagramExecutiveAlwaysShowSelector` keeps VMs, databases, storage, factories — not Web Apps. `appAuthorizedAccess` Web App→SQL therefore disappears even though the edge exists on the graph. `ExecutiveVnetPeeringEndpointIncluder` already solves this for peering; authorization needs the same treatment.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — node filter then edge filter
- `ArchLucid.ArtifactSynthesis/Compilers/ExecutiveVnetPeeringEndpointIncluder.cs` — pattern to follow
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` — `AppAuthorizedAccess`, `HostnameInferredTarget`, `DiagnosticToDestination`, `ServiceConnectorLink`, `PrivateEndpointTarget`, etc.
- `docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md` §5 — do not collapse authorization into topology

## What to build

1. Add `ExecutiveConnectionEndpointIncluder` (or split includers if clearer): given `graph`, filtered `nodes`, and `mode`, append missing endpoint nodes for edges whose `associationType` / `EdgeType` + `InferenceSource` match a curated allow-list:
   - **Authorization overlay:** `appAuthorizedAccess` (`inventory-app-authorized-access`)
   - **Inferred hostname:** `hostnameInferredTarget`
   - **Diagnostics:** `diagnosticToDestination`
   - **Proven linkers:** `serviceConnectorLink`, `privateEndpointTarget` (if not already always shown)
   - Do **not** include every `CONNECTS_TO` — keep Network mode spine honest (document exclusions in tests).
2. Invoke from `DiagramAstFromGraphCompiler` after mode filter and peering includer for modes: **Executive**, **Identity**, **Data**, **DataArchitecture** (and **DataFlow** if those edges are in scope for SN-DF — follow existing `DiagramDataFlowEdgeFilter`).
3. Preserve ordering: mode-filter order first; appended endpoints at tail (same comment as peering includer).
4. Respect `ExecutiveMaxTotalNodes` / tier caps — if inclusion would exceed cap, prefer keeping **both endpoints of the highest-weight edges** (document tie-break: `appAuthorizedAccess` > `serviceConnectorLink` > `hostnameInferredTarget` > diagnostics). Emit no silent drop — optional compile metadata warning if truncated (string constant, not user-facing prose in this prompt).
5. Tests (must fail on current master):
   - Fixture: Web App + SQL DB + `appAuthorizedAccess` edge; Executive compile includes both nodes and the edge.
   - Fixture: edge present but neither endpoint in always-show tier without includer → fails before fix, passes after.
   - Network mode: `appAuthorizedAccess` does **not** become the spine if product rule says hide (match AX-DE-03 test note — document in test name).

## Acceptance criteria

- Executive golden path shows Web App→SQL **May access** when ZIP contains identity + RBAC (no new collection).
- No Azure HTTP at compile. No change to materializers.
- One class per new helper file.

## Constraints

- `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~ConnectionEndpoint|ExecutiveVnetPeering|DiagramAstFromGraphCompiler'`
- Heartbeat if >15s.

## Done when

`DiagramAstFromGraphCompilerTests` (or new sibling) proves authorization endpoints survive Executive filtering.
