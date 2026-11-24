# FND-010 provenance graph sharing-control reuse — 2026-11-24

## Reviewed implementation and confirmed gap

Three `ProvenanceController` routes return the full provenance graph, a decision subgraph, or a node neighborhood for a run in the caller's trusted tenant/workspace/project. The controller has `ReadAuthority` and `EnsureSealedManifestReadAllowedAsync`; the `IProvenanceQueryService` is scope-aware. Yet **none** of the three actions called the existing `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync`. This is an established resource-level sharing-control adoption gap, **not** proof of a cross-tenant escape. Sealed-manifest integrity cannot substitute for the caller's restricted-architecture visibility.

## Narrow reuse and tests

- Inject `IArchitectureShareAccessGate`, already registered in the API's dependency container.
- Put the gate in the existing shared `ProvenanceController.SealedManifestGuard.cs` helper, before `IAuthorityQueryService.GetRunDetailAsync` and before returning to the provenance query service. Deny empty run IDs with the existing non-disclosing 404 policy; return the existing share-gate denial unchanged. Retain all manifest hash, tenant scope and route logic.
- Add `ProvenanceControllerTests` negative cases for **all three** actions, using strict mocks to prove share denial occurs before any provenance or authority service access. Preserve current positive and depth-clamping regressions through an explicitly permissive mock gate.
- Include the existing test class in focused `FND-010 .NET Evidence Authorization` workflow; real CI confirmation is required before marking complete.

**Inspected sources:** `ArchLucid.Api/Controllers/Planning/ProvenanceController.cs`, `ProvenanceController.SealedManifestGuard.cs`, `ArchLucid.Api.Tests/ProvenanceControllerTests.cs`, `ArchLucid.Api/Support/ArchitectureShareAccessGate.cs`, `IArchitectureShareAccessGate.cs`, and focused workflow.

**Limits:** This is a targeted three-route audit, not a blanket central `evidence.read` requirement or claim of all-controller coverage. The SecureNow-specific entitlement remains independently scoped. GitHub's current blob metadata does not prove oldest source-file path appearance or last modification dates; a complete Git path-history review is required. No merge; no comprehensive/full `master` build; only focused PR validation. `RC49` reserved for full builds when requested.
