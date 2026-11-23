# FND-017 semantic .NET dependency boundary

This increment adds a Roslyn analyzer, `FND017001`, that resolves actual type symbols in `ArchLucid.Core` and reports references to types from `ArchLucid.Api`, `ArchLucid.Persistence`, or `ArchLucid.Host.*` assemblies. Unlike source-token checks, symbol resolution handles aliases and qualified names. The diagnostic descriptor remains **Info/advisory**, but `ArchLucid.Core/.editorconfig` upgrades **FND017001 to error** in production Core compilation. Core and API both include the analyzer project with `OutputItemType="Analyzer"`; the SecureNow API diagnostics FND017002–005 remain advisory. This scoped enforcement was merged in [PR #7855](https://github.com/joefrancisGA/ArchLucid/pull/7855), with targeted [FND-017 workflow 45167109380](https://github.com/joefrancisGA/ArchLucid/actions/runs/45167109380) reported successful.

Four compiler-driven tests create in-memory C# assemblies to check forbidden dependencies, aliases, allowed contracts and assembly scope. A dedicated CI workflow compiles and tests the analyzer and retains the existing FND-017 report.

**Limits:** This is an initial semantic rule, not a complete graph or dataflow proof. It does not inspect project-reference edges that are unused in source, reflection, strings, generated code, dynamic loading, method invocation on inferred types, or whether authorization occurs before access. Existing tenant-boundary analyzer rules remain in place. Expand after establishing a reviewed baseline and CI results, then introduce narrowly scoped enforcement.

## FND017001 static receiver reuse audit (2026-11-23)

The original analyzer considered resolved type references in declarations and aliases,
but skipped the expression half of a C# `MemberAccessExpressionSyntax`. A forbidden
type **used only as a static member receiver** (for example, after
`using Forbidden;`, `SecretService.Touch()` or `SecretService.Number`) was
therefore missed: the receiver name was discarded and the invoked/accessed member
is a method/property symbol, not an `INamedTypeSymbol`. This does not prove an
existing production violation; it is a confirmed synthetic-source diagnostic gap.

The focused fix evaluates the receiver and continues to filter by the resolved
`INamedTypeSymbol.ContainingAssembly.Name`, rather than applying text matching.
Namespace names, methods and properties remain excluded by the existing symbol
filter. New regression tests assert a single Core diagnostic for each static-only
reference and no diagnostic when the same source targets `ArchLucid.Contracts`.
FND017002–005 stay advisory; no changes to authorization, CI branch policy, or
runtime behavior are introduced. Focused branch analyzer tests and an
analyzer-enabled Core build must pass before merging.
