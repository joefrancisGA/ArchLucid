# SN-PE-01 — Evidence family catalog (ordinal bands, no percents)

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** AX-DE-01 catalog on trunk. **Do not** implement SN-PE-02–07. **Do not** collect Azure payloads.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Lock a code-owned catalog that maps existing `associationType` values (plus `peReachableTarget` as a **derived** type) to a Data Flow **family**, `PathConfidenceBand`, direction policy, and human label. Store **no** integer percent.

## Why

Owner advice proposed `{ source, target, evidence, confidence: 80 }`. The relationship engine already exists (`AzureInventoryRelationshipAssociationTypes`). Percents invite fake arithmetic and buyer-indefensible “why 80 not 75?”. Data Flow currently special-cases ADF strings in `DiagramDataFlowEdgeFilter` — later prompts must not copy that.

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §§1–5
- `.cursor/prompts/securenow-probable-evidence-00-index.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypeDefinition.cs`
- `ArchLucid.Core/InfraEvidence/PathConfidenceBand.cs`
- `ArchLucid.Core/InfraEvidence/ProvenanceKind.cs`
- `ArchLucid.KnowledgeGraph/WellKnownGraph.cs` (`GraphEdgeTypes.MayAccess`)

## What to build

1. New types in **own files** under `ArchLucid.Core` (or Core + a small KnowledgeGraph consumer later). Example names:
   - `AzureInventoryDataFlowEvidenceFamily` enum: `DeclaredMovement`, `AuthorizedAccess`, `StructuralNetworkPath`, `InferredHostname`.
   - `AzureInventoryDataFlowEdgeDirection` enum: `Undeclared`, `DeclaredRead`, `DeclaredWrite`, `MayRead`, `MayWrite`, `MayAccess`, `NetworkPath`.
   - `AzureInventoryDataFlowEvidenceAssociation` (or similar) metadata: `AssociationType`, `Family`, `DefaultBand`, `Direction`, `DiagramLabel`, `IncludeOnDataFlow`.
2. Catalog rows (ordinal-ignore-case lookup). **IncludeOnDataFlow = true** only for:

   | associationType | Family | Band | Direction | Label |
   |---|---|---|---|---|
   | `adfReadsFrom` / `synapseReadsFrom` | DeclaredMovement | Probable (`DerivedFact` already) | DeclaredRead | Reads from |
   | `adfWritesTo` / `synapseWritesTo` | DeclaredMovement | Probable | DeclaredWrite | Writes to |
   | `adfLinkedService` / `synapseLinkedService` | DeclaredMovement | Confirmed if ObservedFact | Undeclared | Connected to |
   | `adfLinkedServiceInferred` / `synapseLinkedServiceInferred` | InferredHostname | Possible | Undeclared | Likely connected to |
   | `eventGridToDestination` | DeclaredMovement | Confirmed | DeclaredWrite | (new humanizer if missing — e.g. **Routes events to**) |
   | `eventHubCapture` | DeclaredMovement | Confirmed | DeclaredWrite | **Captures to** (add humanizer if missing) |
   | `adfTriggerSource` | DeclaredMovement | Confirmed | Undeclared | keep existing / **Triggers** |
   | `logicAppConnection` | DeclaredMovement | Probable | Undeclared | Connected to |
   | `appAuthorizedAccess` | AuthorizedAccess | Probable | MayAccess | May access |
   | `appToKeyVaultRef` | AuthorizedAccess | Probable | MayAccess | May access |
   | `hostnameInferredTarget` | InferredHostname | Possible | Undeclared | Likely connected to |
   | `serviceConnectorLink` | DeclaredMovement | Confirmed | Undeclared | Connected to |
   | `peReachableTarget` (**add constant**) | StructuralNetworkPath | Probable | NetworkPath | **Private network path** |

3. **IncludeOnDataFlow = false** (tests must lock these): `diagnosticToDestination`, `privateEndpointTarget`, `appServiceToSubnet`, `nicToSubnet`, `vnetPeering`, `nsgAllowRule`, `peDnsZoneGroup`, `privateDnsVnetLink`, NAT/firewall/front door, `identityToRoleAssignment` (hop, not DFD edge).
4. Add `peReachableTarget` to `AzureInventoryRelationshipAssociationTypes` as `Inferred(..., DerivedFact)` with `DefaultGraphEdgeType` `CONNECTS_TO` or a new `GraphEdgeTypes` only if compile requires it — **do not emit rows yet** (SN-PE-04). Comment: composed hop; never ObservedFact.
5. Helper `TryGetDataFlowEvidence(associationType | inferenceSource)` used by SN-PE-03. Null-check inputs.
6. Tests (must fail on current master, pass after):
   - Every `IncludeOnDataFlow` type is a known association type (except document if you introduce `peReachableTarget` in the same catalog).
   - `appAuthorizedAccess` → AuthorizedAccess / Probable / May access / **no** Reads from.
   - `diagnosticToDestination` is **not** on Data Flow.
   - Catalog has **no** `ConfidencePercent` / `int Confidence` property (reflection or type-shape test).
   - Unknown string → not included.

## Acceptance criteria

- No ARM calls. No Mermaid. No filter change in ArtifactSynthesis yet (SN-PE-03).
- No numeric confidence on the metadata type.
- `nsgAllowRule` stays DeterministicInference and off Data Flow.

## Constraints

- Working-tree safety. Plane wins. One collector.
- Do **not** reopen AX-DE collection or SN-DF-01.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~DataFlowEvidence'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s. No full-solution build.

## Done when

A unit test lists Data Flow families and proves diagnostics/raw PE are excluded. `peReachableTarget` exists as a catalog string for SN-PE-04.
