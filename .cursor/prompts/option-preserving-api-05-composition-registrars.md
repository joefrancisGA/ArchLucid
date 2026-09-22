# OP-05 — Omit-able composition registrars (still one host, still INV-006)

**Do not** add a second `Program.cs`. **Do not** stop calling any registrar from `AddArchLucidApplicationServices`. **Do not** move DI helpers onto `ArchLucid.Api` or domain projects. **Do not** split SQL.

Depends on **OP-01** (capability names) and preferably **OP-02**.

## Goal

`ArchLucid.Host.Composition` exposes **four facades** a future second host could omit:

- `AddPlatformCapability`
- `AddAuthorityCapability`
- `AddInfraEvidenceCapability`
- `AddGovernanceCapability`

Today `AddArchLucidApplicationServices` **must still call all four**. This prompt is a seam, not a product split.

## Why

INV-006 requires a single composition style. The extract option dies if a future `SecureNow.Api` still calls one 200-line `AddArchLucidApplicationServices` that registers runs, SCIM, and Marketplace. Facades make “pull in only what you need” a **compile-time and call-site** choice later, without forking the root now.

## Context

- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.cs` (`AddArchLucidApplicationServices`)
- Existing modules (reuse, do not duplicate):
  - `InfraEvidenceCompositionModule`
  - `RegisterGovernance` / `ServiceCollectionExtensions.Governance.cs`
  - `PipelineCompositionModule` / `RunLifecycleOrchestrationCompositionRegistrar` (authority)
  - tenancy, billing, auth-adjacent registration (platform)
- `ArchLucid.Architecture.Tests/SingleCompositionRootServiceCollectionExtensionsTests.cs`
- OP-01 capability ids

## What to build

1. Four **internal or public** static methods on the existing `ServiceCollectionExtensions` partial **or** four one-class-per-file registrars under `ArchLucid.Host.Composition/Startup/Capabilities/` (prefer new folder + one class per file). Each method:
   - takes `IServiceCollection`, `IConfiguration`, and `ArchLucidHostingRole` when the current call needs them
   - null-checks arguments
   - only **moves** existing `Register*` / `*CompositionModule.Register` calls out of `AddArchLucidApplicationServices` into the matching facade
2. `AddArchLucidApplicationServices` becomes: shared options/time/feature-management that are truly cross-cutting, then calls all four facades. If a current `Register*` is ambiguous, put it in **platform** and add `ownerNote` in a short `docs/architecture/data/composition-capability-registrars.md` table (capability → methods moved). Do not leave “mystery” registrations only in the 200-line method.
3. Architecture test: the four method names exist on the composition assembly; `AddArchLucidApplicationServices` still invokes all four (source assertion via reading the `.cs` file **or** a small InternalsVisibleTo test that the production host path did not drop a facade — prefer a source-text test in Architecture.Tests that `ServiceCollectionExtensions.cs` contains all four call names, so omitting one in Program/root fails CI).
4. Do **not** change Worker vs Api hosting role behavior. Worker still uses the same `AddArchLucidApplicationServices`.

## Acceptance criteria

- `dotnet test ArchLucid.Architecture.Tests --filter FullyQualifiedName~CompositionCapability` (or the name you chose) is green.
- INV-006 scan still green (`SingleCompositionRootServiceCollectionExtensionsTests`).
- No new public `IServiceCollection` entrypoints on Application/Persistence/Api.
- Runtime registrations stay equivalent (no feature flags that skip Authority on the current host).

## Constraints

- Reuse modules. Do not copy `InfraEvidenceCompositionModule` into a new class that re-lists every `AddScoped`.
- One class per file. Concrete types. Blank line before `if` unless first in method.
- Do not add `SecureNow.Api`. Do not `#if SECURITY`.
- If a registration truly serves two capabilities (e.g. AgentRuntime used by infra ask **and** reviews), put it in **platform** and note it in the markdown table. Do not register it twice.
- Scoped compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Host.Composition/ArchLucid.Host.Composition.csproj'` if the script exists; otherwise `dotnet build ArchLucid.Host.Composition/ArchLucid.Host.Composition.csproj`.
