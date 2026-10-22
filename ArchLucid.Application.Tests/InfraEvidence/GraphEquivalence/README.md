# Azure graph equivalence baseline

Pinned implementation: master commit `3c0c4fd94336844e6288e4d4fb52895dfb48ab13`.

The original snapshot remains unchanged. Only `private-link-property` selects the documented override `private-link-4396.json`, justified by merged PR #4396 (`09cdbc98e8b6b6bef6890ff2bea4ea9fa7cf5ed8`). The reviewed differences are removal of the duplicate generic CONNECTS_TO edge, deterministic provenance on the typed privateEndpointTarget edge, and addition of property key, resource row ID, and target ARM ID evidence. Node metadata and diagram output are unchanged. Independent assertions require exactly one typed edge and its provenance/evidence fields; the other seven cases still use the original pinned snapshot.

This is a characterization baseline for incremental graph refactoring, not a declaration that the existing algorithm is correct in every case. Eight deterministic synthetic inventory cases cover explicit relationships, missing sources/targets, nested child projection, default/inclusive visibility, cross-subscription peering, and a collected private-link property target. Each case also has independently authored relationship/visibility/placeholder assertions.

`master-3c0c4fd9.json` records normalized graph identities, node metadata, directed edge types/provenance/inference/weights/evidence, and FullSubscription diagram groups, node membership, nodes and non-layout connectors. Generated node/edge IDs, collection order, timestamps, diagram coordinates and layout-only connectors are excluded. Comparator tests verify that identifier/order changes remain equivalent while direction/type/provenance changes are detected.

Run from the repository root:

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release --filter 'FullyQualifiedName~AzureGraphEquivalenceBaselineTests'
```

Before simplifying one helper, run the suite on the pinned baseline and on the proposed implementation with unchanged fixtures and expected output. Review every semantic difference. Preserve this baseline during behavior-preserving refactors. An intentional correction requires separately justified expected behavior, updated independent assertions, and an explicitly reviewed baseline change; never regenerate the baseline automatically when a test fails.

Scope and known limitations:

- This initial corpus is synthetic and small. Add sanitized captured packages and cases for other hydrators before claiming broader equivalence.
- FullSubscription is the initial diagram mode; Executive and specialized security/data-flow modes need additional coverage.
- The private-link override characterizes the reviewed collected-target correction from PR #4396. Missing-target, hidden-target, and redacted-target behavior also has dedicated private-endpoint tests; add more capture cases as refactoring scope expands.
- Ten existing graph/Mermaid rendering failures were documented during PR #4390 and subsequent changes. They are not declared correct or silently waived by this suite.
- Treat each baseline correction separately from behavior-preserving production refactors. Establish a passing before result before changing production code.
