# OP-02 — Architecture ratchet (lock the cut, do not purify the blob)

**Do not** move Application folders to new projects. **Do not** delete existing namespace dependencies to “go green” by rewriting half of Application. **Do not** add a second host. **Do not** widen the allowlist to hide new leakage.

Depends on **OP-01** map JSON. If the map is missing, stop and run OP-01.

## Goal

Make the capability cut **enforced**:

1. Unmapped controllers cannot land.
2. New `infra-evidence` / `governance` / `platform` types must not take a dependency on Architecture-only namespaces, except via a **shrinking** allowlist of current violators.

## Why

Without a ratchet, OP-01 is a wiki page. Every sprint will add FKs and `using ArchLucid.Application.Runs` from inventory code, and the later host extract becomes impossible.

## Context

- `docs/architecture/data/product-capability-map.json` (OP-01)
- `ArchLucid.Architecture.Tests/NamespaceDependencyConstraintEvaluator.cs`
- `ArchLucid.Architecture.Tests/ArchitectureTypeAbsenceConstraintManifest.cs`
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs`
- Forbidden **authority** namespace prefixes (start here; extend from the OP-01 `applicationNamespaces` where `capability=authority`):
  - `ArchLucid.Application.Runs`
  - `ArchLucid.Application.Planning`
  - `ArchLucid.Api.Controllers.Authority`
  - `ArchLucid.Api.Controllers.Architecture`

## What to build

1. **Coverage already in OP-01 tests** — keep them. If OP-01 coverage tests were not merged, include them here rather than inventing a second loader.

2. `ProductCapabilityNamespaceRatchetTests` (one class per file for helpers):
   - Types whose namespace starts with an OP-01 prefix of `infra-evidence`, `governance`, or `platform` must not `HaveDependencyOnAny` the authority prefixes above.
   - **Allowlist** current violating **type names** in `docs/architecture/data/product-capability-namespace-allowlist.json` (sorted). Each entry: `{ "typeName", "forbiddenPrefix", "reason" }`.
   - Fail if a new type violates and is not on the allowlist.
   - Fail if an allowlist entry **no longer** violates (force shrink).
   - Fail if an allowlist `typeName` does not exist (stale).

3. **Controller product-line consistency (soft):** if the UI catalog marks an href `architecture` and you can map that href to a single controller in the JSON, they should match or the controller row is `disputed`. Do **not** fail the build on every unmatched href (UI paths ≠ API routes). A single test that known pairs match is enough (examples: SCIM controllers vs `/administration/scim-provisioning`; TenantBranding vs `/administration/branding`; Runs vs reviews). Put unmatched known pairs in the allowlist JSON with `reason`.

4. Do **not** add NetArchTest rules that fail the entire `ArchLucid.Application` assembly for depending on itself.

## Acceptance criteria

- `dotnet test ArchLucid.Architecture.Tests --filter FullyQualifiedName~ProductCapability` is green.
- A throwaway type under `ArchLucid.Application.InfraEvidence` that references `ArchLucid.Application.Runs` would fail (prove with a comment in the test naming the rule; do not leave the throwaway type in the repo).
- Allowlist length is reported in the summary. Do not “clean” allowlist types in this prompt.

## Constraints

- Reuse `NamespaceDependencyConstraintEvaluator` / NetArchTest. Do not add a new architecture-test framework.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not change production runtime behavior.
- Do not mark every leak `disputed` in the OP-01 map to avoid the ratchet — the allowlist is the honest current debt.
- Scoped tests only.
