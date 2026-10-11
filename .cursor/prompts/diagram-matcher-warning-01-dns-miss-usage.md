# DMW-01 — Warn on a missing private-endpoint DNS link only when usage was collected

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DMW-02 in this session. Do not replace warnings with questions.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md`

**Depends on:** `AzureInventoryPrivateEndpointReachableEdgeMapper` and `AzureInventorySecurityEdgeMaterializer.Materialize` on master. SN-PE-04 already emits `peReachableTarget` only after a DNS join. Do not re-open that hop.

## Goal

`pe-reachable-dns-link-missing` is emitted only for a VNet-integrated compute and a private-endpoint target when some other collected row already says that compute uses that store (or a child or parent of that store). A compute that has no such row produces no warning and no edge. A DNS join that already succeeds still emits one `peReachableTarget` edge and no warning.

## Why

`MapPeReachableTargets` loops every compute that has a VNet (App Service subnet, or VM NIC plus NIC subnet) against every private-endpoint target. When `peDnsZoneGroup` and `privateDnsVnetLink` do not join that compute's VNet, `TryAddDnsMissingWarning` adds `pe-reachable-dns-link-missing:{compute}:{target}`. The edge is correctly skipped. The warning is not. Ten apps and 120 endpoints produce about 1200 distinct strings. The diagram banner counts those strings. They are not evidence that those apps talk to those stores, and they are not evidence that the stores are isolated.

The mapper runs in `AzureInventorySecurityEdgeMaterializer.Materialize` immediately after network associations, before factory linked services, pipeline flows, service connectors, app-setting hosts, and dependency observations are written. A usage row cannot be seen from that call site.

Security: do not invent a `peReachableTarget` edge to clear the warning. Do not expand a subscription or resource-group role onto child resources. Do not hide `rbac-scope-too-broad` or `app-settings-not-collected-hosted-get-only`. Provenance of the hop stays DerivedFact.

Scalability: the warning set becomes the usage pairs that failed the DNS join, not computes × endpoints.

Reliability: a collected usage whose private DNS still does not reach the compute's VNet remains one warning. Silence means "no collected usage row," not "Azure has no dependency."

Cost: no new Azure HTTP. No script version bump. Both customer packages share this materializer.

## Read first

- `ArchLucid.Application/InfraEvidence/AzureInventoryPrivateEndpointReachableEdgeMapper.cs` (`MapPeReachableTargets`, `TryHasDnsJoin`, `TryAddDnsMissingWarning`)
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (the `MapPeReachableTargets` call, then `MapPipelineFlows`, `MapLinkedServices`, `MapLinks`, `MapHosts`, `MapObservations`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryNetworkAssociationEdgeMapper.cs` (`AddRelationshipCompletenessWarnings` — it does not read `peReachableTarget`)
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (the usage constants below, and `IsInventoryAdfMovementInferenceSource`)
- `ArchLucid.Core/InfraEvidence/ArmResourceIdNormalizer.cs` (`IsDescendantOf`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipCompletenessWarningCodes.cs` (`PeReachableDnsLinkMissing`)
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventoryPrivateEndpointReachableEdgeMapperTests.cs`
- `docs/library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md` (do not hide broad-scope RBAC or the hosted app-settings warning)

## What to build

1. Move `AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets` to after the dependency-observation block and before SQL database principals in `Materialize`. Hostname, service-connector, factory, and observed-dependency rows must already be on `relationships`. App-setting and dependency-observation rows are present only when their file flags are true; that is existing behavior. Leave those flags alone.

   The hop still reads only `inventory-appservice-subnet`, `inventory-vm-nic`, `inventory-nic-subnet`, `inventory-private-endpoint`, `inventory-pe-dns-zone-group`, `inventory-private-dns-vnet`, and `inventory-pe-subnet`. Those rows are written before the old call site, so moving the call does not add or remove edges. Do not make a later mapper require `inventory-pe-reachable-target` to already exist.

2. In `MapPeReachableTargets`, keep the DNS join and the edge. Change only the warning. Before the compute × target loops, index usage rows: normalized `FromAzureResourceId` → the normalized `ToAzureResourceId` values whose `InferenceSource` is exactly one of:

   - `inventory-hostname-inferred-target`
   - `inventory-app-key-vault-ref`
   - `inventory-storage-host-ref`
   - `inventory-service-connector-link`
   - `inventory-observed-dependency`
   - `inventory-adf-linked-service`
   - `inventory-adf-linked-service-inferred`
   - `inventory-adf-reads-from`
   - `inventory-adf-writes-to`
   - `inventory-synapse-linked-service`
   - `inventory-synapse-linked-service-inferred`
   - `inventory-synapse-reads-from`
   - `inventory-synapse-writes-to`

   Compare with ordinal ignore case. Do not split a qualifier. Do not treat NIC, subnet, private-endpoint, peering, or role-assignment rows as usage.

3. Call `TryAddDnsMissingWarning` only when that pair emitted no edge and the compute's usage list contains the private-endpoint target, a descendant of that target, or an ancestor of that target. Use `ArmResourceIdNormalizer.IsDescendantOf` (it requires the parent id plus `/`, so `sql1` does not match `sql1extra`). Match the usage source to the compute id exactly. Do not walk parents of the compute: a resource-group row must not warn every app in that group. A deployment slot under a site does not inherit the site's warning in this change.

   A SQL hostname row that points at `{server}/databases/{name}` counts as usage of a private endpoint whose target is `{server}`. A row that points at the storage account counts as usage of a private endpoint whose target is a child of that account. One warning per compute × private-endpoint target, which the existing warned-pair set already dedupes.

4. Leave the warning text `{PeReachableDnsLinkMissing}:{computeArmId}:{targetArmId}`. The ids in the maps are already normalized. Do not add a new warning code. Do not emit an edge when DNS does not join.

## Tests

Extend `ArchLucid.Application.Tests/InfraEvidence/AzureInventoryPrivateEndpointReachableEdgeMapperTests.cs`. Keep the four existing edge assertions green.

1. `MapPeReachableTargets_hub_spoke_without_dns_link_does_not_fan_out` and `MapPeReachableTargets_integration_without_dns_emits_no_edge` keep a warnings list and assert it is empty. Those fixtures have no usage row.
2. An app with `inventory-hostname-inferred-target` to the SQL server, a private endpoint to that server, and no DNS zone link: no `inventory-pe-reachable-target` edge, and exactly one warning `pe-reachable-dns-link-missing:{normalizedApp}:{normalizedSql}`.
3. Two VNet-integrated apps and two private-endpoint targets (SQL and storage). Only the first app has a usage row to SQL. No DNS links. Warnings contain only that one app × SQL pair. Neither app gets a `peReachableTarget` edge. The storage target produces no warning.
4. Usage points at `{sqlServer}/databases/orders` and the private endpoint targets the server. No DNS link. One warning, and the target segment of that warning is the server id.
5. The same-VNet fixture, plus a usage row to SQL: one `peReachableTarget` edge and an empty warning list.

Do not add a live Azure test. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile and run `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryPrivateEndpointReachableEdgeMapperTests'`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not bump `$scriptVersion`. Do not edit the customer package scripts.
- Do not re-run SN-PE-04, AX-DE, AX-DC, or DMW-02 as greenfield.

## Done when

A VNet-integrated app with no collected usage of a private-endpoint target adds neither an edge nor a `pe-reachable-dns-link-missing` warning. An app whose hostname, key vault, storage host, service connector, factory, or observed-dependency row names that target (or its child or parent) still gets no edge when DNS does not join, and gets one warning. A DNS join still draws one DerivedFact `peReachableTarget` and no warning. The stored banner changes only when a snapshot is materialized again.
