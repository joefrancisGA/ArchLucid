# FND-017 semantic .NET dependency boundary

This increment adds a Roslyn analyzer, `FND017001`, that resolves actual type symbols in `ArchLucid.Core` and reports references to types from `ArchLucid.Api`, `ArchLucid.Persistence`, or `ArchLucid.Host.*` assemblies. Unlike source-token checks, symbol resolution handles aliases and qualified names. The diagnostic is **Info/advisory** and is not wired as an error in application builds.

Four compiler-driven tests create in-memory C# assemblies to check forbidden dependencies, aliases, allowed contracts and assembly scope. A dedicated CI workflow compiles and tests the analyzer and retains the existing FND-017 report.

**Limits:** This is an initial semantic rule, not a complete graph or dataflow proof. It does not inspect project-reference edges that are unused in source, reflection, strings, generated code, dynamic loading, method invocation on inferred types, or whether authorization occurs before access. Existing tenant-boundary analyzer rules remain in place. Expand after establishing a reviewed baseline and CI results, then introduce narrowly scoped enforcement.
