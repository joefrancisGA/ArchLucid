# AX-DE-01 — Association catalog for diagram enrichment

**Do not** collect new Azure payloads in this prompt. Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Extend `AzureInventoryRelationshipAssociationTypes` (and ArmKind / humanizer stubs) so later AX-DE prompts emit catalogued edges instead of inventing strings.

## Why

IE-RF-01 locked network types. ADF added `adfLinkedService*` / `adfReadsFrom` / `adfWritesTo`. Connection-point P0/P1 types (`diagnosticToDestination`, `eventGridToDestination`, `logicAppConnection`, `appAuthorizedAccess`, …) are documented but not in the catalog.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipArmKind.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- `docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md` §9

## What to build

1. Add ArmKind values as needed (own comments): `Compute`, `DiagnosticDestination`, `EventGridTopic`, `LogicApp`, `MessagingNamespace`, `DatabricksWorkspace`, `ServiceConnectorTarget`, `IntegrationRuntime`. Reuse `DataFactory` / `LinkedServiceTarget` for Synapse by documenting that Synapse workspace is a factory cousin — **or** add `SynapseWorkspace` if compile needs a distinct kind.
2. Catalog rows (unique ordinal-ignore-case). Existing ADF/network types **stay**:

   | associationType | from → to | Default ProvenanceKind | Diagram label |
   |---|---|---|---|
   | `diagnosticToDestination` | resource → LA / storage / Event Hub | ObservedFact | **Sends diagnostics to** |
   | `eventGridToDestination` | topic/domain/system topic → handler ARM id | ObservedFact if ARM id | **Publishes to** |
   | `logicAppConnection` | workflow → `Microsoft.Web/connections` or ARM target | DerivedFact if typed; DeterministicInference if host-only | **Connected to** |
   | `identityToRoleAssignment` | compute → MI principal node | ObservedFact | **Uses identity** (keep `USES_IDENTITY` if already mapped) |
   | `appAuthorizedAccess` | compute → data/resource scope | DerivedFact | **May access** |
   | `appToKeyVaultRef` | app → vault | DerivedFact | **Uses vault** |
   | `hostnameInferredTarget` | app → unique FQDN match | DeterministicInference | **Likely connected to** |
   | `serviceConnectorLink` | app → linker target | ObservedFact | **Connected to** |
   | `synapseLinkedService` / `synapseLinkedServiceInferred` | workspace → store | same as ADF | **Connected to** / **Likely connected to** |
   | `synapseReadsFrom` / `synapseWritesTo` | workspace → store | DerivedFact | **Reads from** / **Writes to** |
   | `adfTriggerSource` | trigger source ARM / host → factory | ObservedFact / DeterministicInference | **Triggers** |
   | `adfIntegrationRuntime` | factory → IR node or subnet | ObservedFact | **Runs on** |
   | `eventHubCapture` | hub → storage | ObservedFact | **Captures to** |
   | `natGatewayToSubnet` | NAT GW → subnet | ObservedFact | **connects** |
   | `firewallToSubnet` | firewall → subnet | ObservedFact | **protects** |
   | `frontDoorToOrigin` | Front Door / AFD → origin host or ARM id | ObservedFact / DeterministicInference | **connects** |
   | `containerAppToEnv` | container app → managed env | ObservedFact | **connects** |
   | `peDnsZoneGroup` | PE → private DNS zone | ObservedFact | **connects** |

3. Do **not** emit rows yet. Tests: every new type unique; existing ADF/network strings still match; typo is not a member.
4. Humanizer: wire the **labels in the table** for the new constants (even if no edges exist). Tests in `DiagramEdgeLabelHumanizerTests` (or equivalent).
5. Docs: 8-line note on `docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md` pointing at this prompt set.

## Acceptance criteria

- No `management.azure.com` client changes.
- SchemaVersion stays 2.
- `nsgAllowRule` remains DeterministicInference.

## Constraints

- Do not change Mermaid compile beyond humanizer.
- Do not add ZIP companions.
- Compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` plus ArtifactSynthesis.Tests if humanizer tests live there.

## Done when

A unit test lists the new catalog types and labels. Hosted and PowerShell builders still compile against the same constants.
