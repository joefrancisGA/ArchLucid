# SN-QA-01 — Directional SecureNow mutation tests

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QA-02 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/QA_Ideas.md`, Turn 6, recommended item 1.

## Goal

Add test-only directional mutations beside the existing SecureNow synthetic-world suite. Each mutation changes one security-relevant fact. The test asserts a one-direction invariant on the affected dimension. A change that should worsen exposure, privilege, or cut-point leverage must not improve that dimension.

## Why

`SecureNowSyntheticAzureWorldMetamorphicTests` only checks that irrelevant changes leave ranking and cut points stable. That cannot catch a ranker that treats public ingress as safer, or a cut-point analyzer that still credits an identity after the paths through it are removed.

## Read first

- `docs/library/SECURENOW_SYNTHETIC_AZURE_WORLDS.md`
- `docs/library/SECURENOW_METAMORPHIC_ASSURANCE.md`
- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzureWorldCatalog.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SyntheticAzureWorlds/SyntheticAzureWorldMetamorphs.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowSyntheticAzureWorldMetamorphicTests.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecurityEvidencePathRankCalculator.cs`
- `SecurityEvidenceCutPointAnalyzer` (the type already called by the metamorphic tests)

## What to build

Add a new test class, `SecureNowSyntheticAzureWorldDirectionalMutationTests`, in `ArchLucid.Application.Tests/InfraEvidence/`. Put new mutation helpers in `SyntheticAzureWorlds/`, one type per file. Follow the existing `SyntheticAzureWorld` / `SyntheticAzurePath` / `SyntheticAzureHop` shape. Reuse catalog worlds as baselines. Do not rewrite the invariance tests.

Author expected relations by inspection. Do not call `SecurityEvidencePathRankCalculator` or `SecurityEvidenceCutPointAnalyzer` to manufacture the expected relation. Production code runs only on the assertion side.

Required cases:

1. **Public ingress does not improve exposure.** Start from the private path in `public-exposure-vs-private-endpoint`. Add a hop from `SecureNowArchitectConstants.InternetPublicExposureNodeId` using `PublicNetworkAccessHopEdgeType`. `TechnicalExposureScore` of the mutated path must be greater than or equal to the private baseline. The mutated path must not rank below the unchanged private path.
2. **A private-endpoint hop does not cancel public exposure.** Start from the public path and add a `private-endpoint-route` hop. `TechnicalExposureScore` must not decrease. Do not relabel the path as private.
3. **Removing public exposure does not worsen exposure.** Remove the public-exposure hop from the public path. `TechnicalExposureScore` must not increase.
4. **Write privilege does not rank as weaker than read.** On otherwise identical privilege paths, replace `GraphEdgeTypes.CanRead` with `GraphEdgeTypes.CanWrite`. `PrivilegeDepthScore` of the write path must be greater than or equal to the read path.
5. **Removing the shared identity reduces its cut.** Start from `shared-managed-identity-cut-point`. Drop the shared managed-identity node from two of the three paths by replacing it with distinct identity node ids. The production cut for `node:{SharedManagedIdentityNode}` must collapse fewer paths than the three-path baseline. Hand-author the expected collapsed counts (3, then 1). Do not compute those counts with the production analyzer.

Compare the named dimension (`TechnicalExposureScore`, `PrivilegeDepthScore`, or cut collapsed-path count). Do not require the composite score to move in only one direction. Cost, confidence, and blast radius may trade off, and this suite does not claim a single security score.

## Docs

Add a short "Directional mutations" section to `docs/library/SECURENOW_METAMORPHIC_ASSURANCE.md`. State that these transforms are semantically relevant, that each invariant is one dimension, and that they are test-only. Do not describe them as buyer-facing proof.

## Acceptance criteria

- Five focused `[Fact]` tests, each with one mutation and one stated relation.
- Existing metamorphic tests still pass.
- No Azure calls, no LLM, no new `IFindingEngine`, no product UI, no ranking-formula change unless a test exposes a defect that contradicts an invariant above. If you fix production code, keep the fix to that defect and explain it in the session summary.
- No `ConfigureAwait(false)` in tests.
- One class per file.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run only the new test class plus `SecureNowSyntheticAzureWorldMetamorphicTests` and `SecureNowSyntheticAzureWorldTests`.
- Do not commit. Do not edit unrelated dirty files.

## Done when

A reviewer can see, without reading the ranker, why each mutation must not improve the named dimension, and the tests fail if production moves that dimension the wrong way.
