---
name: archlucid-new-domain-project
description: >-
  Adds a new ArchLucid.* class library or test project to the solution, solution
  filters, ProjectReferences, and house style. Use when introducing a new domain
  assembly, splitting code into a new project, or adding matching *.Tests beside
  an existing ArchLucid project.
disable-model-invocation: true
---

# ArchLucid new domain project

## Approach

Clone patterns from the **closest existing** sibling (e.g. another `ArchLucid.*` library + `.Tests`). Use root [`Directory.Build.props`](../../../Directory.Build.props) / [`Directory.Packages.props`](../../../Directory.Packages.props) for framework and central package versions — do not invent ad-hoc versions.

## Steps

1. **Create folders** at repo root: `ArchLucid.NewName/` and optionally `ArchLucid.NewName.Tests/`.

2. **`.csproj`:** Start from a similar project’s `.csproj`:
   - `TargetFramework`: **net10.0** (match existing projects, e.g. [`ArchLucid.Core/ArchLucid.Core.csproj`](../../../ArchLucid.Core/ArchLucid.Core.csproj)).
   - `ImplicitUsings` / `Nullable` / `RootNamespace` aligned with folder name.
   - `ProjectReference` to domain dependencies (often `ArchLucid.Contracts` and/or upstream libs).
   - Analyzers / `InternalsVisibleTo` only if the sibling project uses them.

3. **Register in solution:**

   ```bash
   dotnet sln ArchLucid.sln add ArchLucid.NewName/ArchLucid.NewName.csproj
   dotnet sln ArchLucid.sln add ArchLucid.NewName.Tests/ArchLucid.NewName.Tests.csproj
   ```

4. **Solution filters:** Add the new `.csproj` paths to the **`projects`** array in each applicable filter at repo root (paths relative to repo root):
   - [`ArchLucid.Core.slnf`](../../../ArchLucid.Core.slnf)
   - [`ArchLucid.Backend.slnf`](../../../ArchLucid.Backend.slnf)
   - [`ArchLucid.UI.slnf`](../../../ArchLucid.UI.slnf) — only if the project belongs in the minimal UI slice (typically Contracts + Api.Client + tests only).

   Rule pointer: [`AGENTS.md`](../../../AGENTS.md) — update filters when adding or renaming `*.csproj` under the repo root.

5. **Wire references:** Add `ProjectReference` from consuming apps (`ArchLucid.Application`, `ArchLucid.Api`, workers, etc.) only where needed; avoid cyclic graphs. Check extension points against [`.cursor/rules/Architecture-Invariants.mdc`](../../../.cursor/rules/Architecture-Invariants.mdc) / [`docs/library/V1_SCOPE.md`](../../../docs/library/V1_SCOPE.md).

6. **Style:** Follow [`docs/library/CSHARP_HOUSE_STYLE.md`](../../../docs/library/CSHARP_HOUSE_STYLE.md) and `.cursor/rules/CSharp-*.mdc` (one class per file, concrete types, null checks, etc.).

7. **Verify:**

   ```bash
   dotnet build ArchLucid.sln -c Release
   ```

## Do not

- Add a second `Controllers` tree or duplicate casing-only paths (see [`docs/engineering/BUILD.md`](../../../docs/engineering/BUILD.md) API layout note).
