> **Scope:** Contributor-reference — Maintainer-facing checklist for collapsing `ArchLucid.Persistence.*` class libraries into a single `ArchLucid.Persistence` project — not runtime API docs, exhaustive ADR history, or a substitute for running `dotnet build` / `dotnet test` after edits.

# ArchLucid.Persistence Consolidation Plan

> **Phase 1 complete (2026-05-21):** `ArchLucid.Persistence.MigrateVerify` library types moved to `ArchLucid.Persistence/MigrateVerify/` (`MigrateVerifyConnectionStringReader`); tests consolidated into `ArchLucid.Persistence.Tests/MigrateVerify/`; `ArchLucid.Persistence.MigrateVerify.Tests` removed from the solution. The `ArchLucid.Persistence.MigrateVerify` executable remains as a thin CI/operator entrypoint calling into the consolidated library.

## Objective
Reduce the cognitive load and maintenance burden of navigating 6 overlapping `ArchLucid.Persistence.*` sub-assemblies by merging them into a single cohesive `ArchLucid.Persistence` project.

## Projects to be Merged
The following class libraries all currently use the `ArchLucid.Persistence` namespace and can be safely consolidated:
1. `ArchLucid.Persistence.Advisory`
2. `ArchLucid.Persistence.Alerts`
3. `ArchLucid.Persistence.Coordination`
4. `ArchLucid.Persistence.Integration`
5. `ArchLucid.Persistence.Runtime`

*(Note: `ArchLucid.Persistence.MigrateVerify` is an executable (`OutputType: Exe`) and `.Tests` projects should remain separate).*

## Step 1: File Relocation
Move all `.cs` files from the source directories into feature folders inside `ArchLucid.Persistence`:
- Move `ArchLucid.Persistence.Advisory/*.cs` to `ArchLucid.Persistence/Advisory/`
- Move `ArchLucid.Persistence.Alerts/*.cs` to `ArchLucid.Persistence/Alerts/`
- Move `ArchLucid.Persistence.Coordination/*.cs` to `ArchLucid.Persistence/Coordination/`
- Move `ArchLucid.Persistence.Integration/*.cs` to `ArchLucid.Persistence/Integration/`
- Move `ArchLucid.Persistence.Runtime/*.cs` to `ArchLucid.Persistence/Runtime/`

*(No namespace changes are required because all these projects already specify `<RootNamespace>ArchLucid.Persistence</RootNamespace>`)*

## Step 2: Update `ArchLucid.Persistence.csproj` Dependencies
We need to merge the unique Nuget and Project references from the child projects into the main `ArchLucid.Persistence.csproj`.

**Add the following Nuget Packages:**
```xml
<PackageReference Include="Azure.Communication.Email" />
<PackageReference Include="Azure.Identity" />
<PackageReference Include="Azure.Storage.Blobs" />
<PackageReference Include="Microsoft.Extensions.Caching.Memory" />
<PackageReference Include="Microsoft.Extensions.Caching.Hybrid" />
<PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" />
<PackageReference Include="Serilog" />
<PackageReference Include="Stripe.net" />
```

**Add the following Project References:**
```xml
<ProjectReference Include="..\ArchLucid.Retrieval\ArchLucid.Retrieval.csproj" />
```

**Remove Internal References:**
Remove `<ProjectReference>` entries pointing to `.Integration`, `.Advisory`, `.Coordination`, etc., from `ArchLucid.Persistence.csproj`.

## Step 3: Global Solution Search & Replace
1. Remove the 5 collapsed `.csproj` files.
2. Open `ArchLucid.sln` and delete the references to the 5 collapsed projects.
3. Across all other projects (e.g., `ArchLucid.Api.csproj`, `ArchLucid.Host.Composition.csproj`, `ArchLucid.Persistence.Tests.csproj`, `ArchLucid.Application.csproj`), run a find-and-replace to strip out:
   - `<ProjectReference Include="..\ArchLucid.Persistence.Advisory\ArchLucid.Persistence.Advisory.csproj" />`
   - `<ProjectReference Include="..\ArchLucid.Persistence.Alerts\ArchLucid.Persistence.Alerts.csproj" />`
   - `<ProjectReference Include="..\ArchLucid.Persistence.Coordination\ArchLucid.Persistence.Coordination.csproj" />`
   - `<ProjectReference Include="..\ArchLucid.Persistence.Integration\ArchLucid.Persistence.Integration.csproj" />`
   - `<ProjectReference Include="..\ArchLucid.Persistence.Runtime\ArchLucid.Persistence.Runtime.csproj" />`
   
   Ensure that a single reference to `ArchLucid.Persistence.csproj` remains in those files.

## Step 4: Compilation and Validation
- Run `dotnet build` to ensure all type forwarding and DI container resolution continues to function without the sub-assemblies.
- Run `dotnet test` to confirm `ArchLucid.Persistence.Tests` properly exercises the newly unified project.