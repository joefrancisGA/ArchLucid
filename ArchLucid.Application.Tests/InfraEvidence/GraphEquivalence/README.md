# Azure graph equivalence baseline

Pinned implementation: master commit `3c0c4fd94336844e6288e4d4fb52895dfb48ab13`.

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
- The private-link case characterizes the current collected-target behavior, including the generic property scanner's additional connection. Draft PR #4396 is intentionally outside this baseline; if merged, review its typed edge/provenance/evidence changes and update only the justified expectations.
- Ten existing graph/Mermaid rendering failures were documented during PR #4390 and subsequent changes. They are not declared correct or silently waived by this suite.
- This PR changes test infrastructure only. Production simplification follows after this baseline is established.
