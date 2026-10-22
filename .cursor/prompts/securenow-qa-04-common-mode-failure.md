# SN-QA-04 — Common-mode failure hypotheses

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Implement this after SN-QA-03 if that hypothesis model exists. If it does not, add only the common-mode candidate and the path-detail field defined here.

**Repo:** `c:\ArchLucid`

## Goal

Detect when resources that look separate still share one failure or privilege dependency. Represent that as a common-mode hypothesis in the current SecureNow product.

## Why

`SharedControlBlastRadiusEnumerator` already finds a shared managed identity, a broad role assignment, a broad policy assignment, and a central Key Vault. It does not say that two regionally separate workloads lose their independence because they share that control. The shared node is the blast radius. The common-mode claim is the failed redundancy.

## Read first

- `docs/library/SECURENOW_ARCHITECT_PLANE.md`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SharedControlBlastRadiusEnumerator.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SharedControlBlastRadiusCandidate.cs`
- SN-QA-03 hypothesis types if present

## What to build

Extend the shared-control analysis. Do not replace the existing blast-radius candidates.

A common-mode result requires all of the following:

- one shared dependency already recognized by the blast-radius enumerator, or a DNS zone or virtual hub referenced by two dependents
- at least two dependent resources
- those dependents differ by region, or by application identity when region is absent
- evidence references for the shared dependency and each dependent

Emit a `CommonModeDependency` hypothesis or, if SN-QA-03 has not landed, a `CommonModeDependency` field on the existing shared-control candidate:

- shared node id
- dependent resource ids
- separating dimension: `Region` or `Application`
- `PathConfidenceBand` equal to the weakest supporting evidence
- status `Open`

Required cases:

1. Two web apps in `eastus` and `westus` using the same managed identity produce one open common-mode result. The identity is the shared node.
2. Two apps in the same region with distinct identities produce no common-mode result from region separation.
3. Two apps whose Key Vault dependency is missing remain silent. Missing evidence is not a shared dependency.
4. A single dependent never produces a common-mode result.

Copy may say: "These resources are in different regions and use the same identity." It must not say that a region has failed, that redundancy is absent beyond the cited dependency, or that compromise has occurred.

## Acceptance criteria

- Existing shared-control blast-radius results stay intact.
- Common-mode results cite every dependent they group.
- No Azure mutation, no LLM, no new `IFindingEngine`, and no numeric confidence.
- Tests use a synthetic snapshot or synthetic relationships. Expected groupings are hand-authored.
- Results are tenant-scoped and appear on the existing path or shared-control read model.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new tests and the existing shared-control blast-radius tests.
- Do not commit.

## Done when

A reviewer can point to two separate workloads, name the one dependency they share, and see that the product kept the redundancy claim open only for that cited dependency.
