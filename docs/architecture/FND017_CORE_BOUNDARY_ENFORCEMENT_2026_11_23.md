# FND-017 Core dependency boundary — first staged enforcement increment

**Date:** 2026-11-23  
**Scope:** Only `FND017001` in the `ArchLucid.Core` project. No full master build; this PR needs focused CI verification.

## Current implementation evidence

- `CoreDependencyBoundaryAnalyzer` resolves referenced `INamedTypeSymbol` symbols rather than comparing source text. Its assembly-name restriction runs only when the current compilation's assembly name equals `ArchLucid.Core`.
- Forbidden assembly identities: `ArchLucid.Api`, `ArchLucid.Persistence`, or `ArchLucid.Host.*`. Allowed: `ArchLucid.Contracts` and other unrelated assemblies.
- The checked-in `ArchLucid.Core.csproj` already references `ArchLucid.Analyzers.csproj` as a compiler analyzer (`OutputItemType="Analyzer"`, `ReferenceOutputAssembly="false"`). Core's only product project reference is `ArchLucid.Contracts`; this is a **source/dependency inventory**, not a measured zero-diagnostic build.
- Prior FND-017 audit documented potential false positives in other rules, especially the mode-sensitive SecureNow authorization checks. Those remain advisory.

## Change

1. Place `ArchLucid.Core/.editorconfig` with `dotnet_diagnostic.FND017001.severity = error`. The scoped file keeps the other FND017 diagnostics unchanged and makes forbidden Core type references compiler errors.
2. Extend the existing FND-017 GitHub Actions workflow with a **focused Release build of `ArchLucid.Core/ArchLucid.Core.csproj`**, including analyzers. Do not run a repository-wide build on `master`.
3. Extend analyzer regressions to include both `ArchLucid.Host.Composition` and `ArchLucid.Host.Core`, and a checked-in project/config wiring test.
4. Correct the architectural reuse ledger: FND-016/017/018 reference and Roslyn PRs have merged, but reference presence does not prove production service adoption.

## Risk and boundary

This rule is a *compile-time architectural guard*, not runtime authorization, network isolation, or a full dependency graph checker. It detects forbidden type symbols that the C# compilation can resolve; it does not by itself detect reflection, string-based dynamic loading, aliases without symbol resolution, cross-project transitive side effects, or architecture semantics outside Core.

An implementation requiring a new reference from Core to a forbidden implementation assembly should fail the focused Core build, rather than being waived by changing global analyzer severity.

## Verification gate

The following must run and pass on this PR branch before merging:

```sh
dotnet test ArchLucid.Analyzers.Tests/ArchLucid.Analyzers.Tests.csproj \
  --filter FullyQualifiedName~CoreDependencyBoundaryAnalyzerTests

dotnet build ArchLucid.Core/ArchLucid.Core.csproj --configuration Release \
  -p:RunAnalyzers=true -p:RunAnalyzersDuringBuild=true
```

A passing focused Core build is the **first actual production-source diagnostic baseline**; until then, the observed number of Core diagnostics is *unknown*, not zero. The existing advisory Python scan and FND017002–005 tests remain separately reported and are not promoted by this increment. No required-status-check or branch-protection rule was altered; maintainers can make the FND-017 workflow required after CI evidence is available.
