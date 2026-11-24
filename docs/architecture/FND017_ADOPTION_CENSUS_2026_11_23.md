# FND-017 compiler-analyzer adoption census (2026-11-23)

## Decision and scope

Audit **existing** FND-017 architectural analyzers for production project registration, actual compile targets, and enforced versus advisory severity. This is not a new architecture control, full repository scan, or proof of runtime authorization. Branch: `audit/fnd017-target-adoption-20261123`, from `master`. The repository owner retains merge authority; no full `master` build is authorized.

## Authoritative definitions

| Roslyn diagnostic | Existing analyzer | Actual target | Severity proven in checked-in source |
|---|---|---|---|
| `FND017001` | `CoreDependencyBoundaryAnalyzer` | `ArchLucid.Core`: forbidden API, Persistence, and Host implementation type dependencies | `Info` descriptor promoted to **error** by `ArchLucid.Core/.editorconfig` |
| `FND017002` | `SecureNowSnapshotAuthorizationOrderAnalyzer` | `ArchLucid.Api`, `GetArchitectureGraphTemporalSnapshot` | **Info**, advisory |
| `FND017003` | `AuthorizationDecisionConsumptionAnalyzer` | Same single API endpoint | **Info**, advisory |
| `FND017004` | `SnapshotAuthorizationDominanceAnalyzer` | Same single API endpoint | **Info**, advisory |
| `FND017005` | `SnapshotAuthorizationResourceBindingAnalyzer` | Same single API endpoint | **Info**, advisory |

These rules are intentionally scope-limited. Four `Info` diagnostics do **not** establish authorization coverage of other API endpoints, workers, or the rest of the repository. FND017002/004 historically had exchange-mode false-positive risks; mode-aware source patterns are already present. Do not silently promote them without a fresh real-source diagnostic baseline and adversarial mode checks.

## Explicit production project inspection (18 selected C# projects)

All 18 listed projects had their checked-in `.csproj` opened. **15** explicitly reference `ArchLucid.Analyzers.csproj` with `OutputItemType="Analyzer"` and `ReferenceOutputAssembly="false"`:

1. `ArchLucid.Api`
2. `ArchLucid.Application`
3. `ArchLucid.AgentRuntime`
4. `ArchLucid.ArtifactSynthesis`
5. `ArchLucid.ContextIngestion`
6. `ArchLucid.Contracts`
7. `ArchLucid.Core`
8. `ArchLucid.Decisioning`
9. `ArchLucid.KnowledgeGraph`
10. `ArchLucid.Mcp`
11. `ArchLucid.Notifications`
12. `ArchLucid.Notifications.Email.RazorLight`
13. `ArchLucid.Persistence`
14. `ArchLucid.Provenance`
15. `ArchLucid.Retrieval`

The other **three inspected projects**—`ArchLucid.Host.Core`, `ArchLucid.Host.Composition`, and `ArchLucid.Capabilities.Cost`—have no explicit analyzer reference. That is **not a demonstrated violation** of these particular five rules: their Roslyn implementations explicitly target only `ArchLucid.Core` (001) or `ArchLucid.Api` plus one method (002–005). Adding references there without a relevant rule would create build cost without coverage benefit. Other projects not inspected may exist; 15/18 is a **sample inventory**, not a repository-wide adoption percentage.

**Measured applicable wiring:** both inspected production target assemblies (`ArchLucid.Core` and `ArchLucid.Api`) explicitly load the shared analyzer project: **2/2 target projects**. **Enforcement:** 1 of the 5 inspected diagnostics is intentionally a compile error on its target; the other 4 remain advisory. These numbers describe source configuration, not an executed compiler result.

## Real consumer and regression audit

- `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs` declares `GetArchitectureGraphTemporalSnapshot`. Source inspection shows two SecureNow-gated authorization calls and separate denied-decision exits before protected reads in exchange mode; ordinary non-exchange mode is a distinct path. Existing `SecureNowActualEndpointSourceTests` checks the checked-in endpoint, and FND-017 analyzer unit tests exercise synthetic negative cases. This is not an interprocedural runtime proof.
- `ArchLucid.Core/ArchLucid.Core.csproj` already references the analyzer, and `ArchLucid.Core/.editorconfig` upgrades only FND017001. `CoreDependencyBoundaryAnalyzerTests.Core_project_is_wired_to_analyzer_and_has_scoped_enforcement` protects that path.
- **Confirmed regression-test omission, not a production defect:** the same explicit project-registration safeguard did **not** exist for the `ArchLucid.Api` consumer. A new test in the **existing** `CoreDependencyBoundaryAnalyzerTests` class now checks API analyzer registration and the presence of the real endpoint, and asserts that four existing API analyzer descriptors remain enabled and informational. No new analyzer/reference or production application code was introduced.
- The existing focused `.github/workflows/fnd017-dotnet-semantic-boundaries.yml` selects `CoreDependencyBoundaryAnalyzerTests` and the actual endpoint tests, so the new test is reached through the existing targeted workflow. It performs a focused Core build, not a full `master` build. Source registration alone cannot assert that workflow has passed at this PR head.

## Source provenance and time limits

Inspected definition blobs (`master` at the time of this audit): 
`CoreDependencyBoundaryAnalyzer.cs` `4d63507a17018c9f7089fda5aa10e8d1e0196806`;
`SecureNowSnapshotAuthorizationOrderAnalyzer.cs` `9922742c7b3064dea5650461a01e8b3549591a42`;
`AuthorizationDecisionConsumptionAnalyzer.cs` `d174643dd71c1130e4606a764267aab1c18c2cd0`;
`SnapshotAuthorizationDominanceAnalyzer.cs` `9f07ca6e390debf5e85ff8e96213ea9f05c617a1`;
`SnapshotAuthorizationResourceBindingAnalyzer.cs` `17c552b4d3932e571332c6e510c47be764a9700f`.

Oldest source-file age and last-touch timestamps for the reviewed definitions are **not yet verified**: the available GitHub content queries supply file/blob SHAs, not complete path history. Do not mislabel a blob hash or report date as a last-modified date. A follow-up with full `git log --follow` history can establish oldest path appearance and last touch for each source file.

## Acceptance criteria and next reuse decision

Focused PR CI must execute `dotnet test ArchLucid.Analyzers.Tests/ArchLucid.Analyzers.Tests.csproj --filter FullyQualifiedName~CoreDependencyBoundaryAnalyzerTests` and the existing `FND-017 .NET Semantic Architecture Boundaries` workflow. Preserve current `Core` severity, leave the four API checks advisory, and distinguish actual CI results from source inventory.

**Next audit target:** broaden the *consumer inventory*, not enforcement automatically: inspect other API evidence-read endpoints for central authorization reuse (FND-010) and identify a specific failure only when real production call sites warrant it. Parallel systemic code coverage (Aspects) should continue independently of targeted security hunts.
