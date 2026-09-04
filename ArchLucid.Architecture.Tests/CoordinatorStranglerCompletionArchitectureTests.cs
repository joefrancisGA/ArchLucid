using ArchLucid.Api.Routing;
using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     ADR 0021 / ADR 0030 / TB-305 / TB-919 closure pins: the coordinator pipeline is retired in production code;
///     run-lifecycle writes flow only through the authority orchestrator and canonical <c>v1/architecture/*</c>
///     routes. The deprecated HTTP aliases ADR 0042 introduced were deleted by TB-919 — this must not reintroduce
///     dual storage, legacy commit orchestration, or a resurrected alias route.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoordinatorStranglerCompletionArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] RetiredProductionTypeNames =
    [
        "ArchitectureRunCommitOrchestrator",
        "RunCommitPathSelector",
        "LegacyRunCommitPathOptions",
        "CoordinatorPipelineDeprecationFilter",
        "CoordinatorPipelineDeprecatedAttribute",
        "ICoordinatorGoldenManifestRepository",
        "ICoordinatorDecisionTraceRepository",
        "RunCommitOrchestratorFacade",
    ];

    [Fact]
    public void Adr0030_header_declares_coordinator_strangler_fully_retired()
    {
        string path = Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0030-coordinator-authority-pipeline-unification.md");
        string text = File.ReadAllText(path);

        text.Should().Contain(
            "coordinator strangler initiative fully retired",
            "ADR 0030 PR A final cleanup must record code-complete strangler retirement");
    }

    [Fact]
    public void Retired_coordinator_pipeline_types_are_absent_from_production_sources()
    {
        List<string> violations = [];

        foreach (string path in Directory.EnumerateFiles(RepoRoot, "*.cs", SearchOption.AllDirectories))
        {
            if (path.Contains(".Tests", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!IsArchLucidProductionSource(path))
                continue;

            string text = File.ReadAllText(path);

            foreach (string typeName in RetiredProductionTypeNames)
            {
                if (DefinesType(text, typeName))
                    violations.Add($"{Path.GetRelativePath(RepoRoot, path)} defines {typeName}");
            }
        }

        violations.Should().BeEmpty(
            "ADR 0030 PR A3 deleted legacy coordinator commit types; reintroduction requires a new ADR:"
            + Environment.NewLine
            + string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void AuthorityDrivenArchitectureRunCommitOrchestrator_is_the_only_commit_orchestrator_implementation()
    {
        IEnumerable<Type> commitOrchestratorImplementations = typeof(IArchitectureRunCommitOrchestrator).Assembly
            .GetTypes()
            .Where(type => type is { IsClass: true, IsAbstract: false })
            .Where(type => typeof(IArchitectureRunCommitOrchestrator).IsAssignableFrom(type));

        commitOrchestratorImplementations.Should().ContainSingle(
            type => type == typeof(AuthorityDrivenArchitectureRunCommitOrchestrator),
            "ADR 0030 PR A3 must keep a single commit orchestrator on the authority pipeline");
    }

    [Fact]
    public void Host_composition_registers_authority_decision_engine_not_coordinator_named_method()
    {
        string coordinatorArtifacts = Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Composition",
            "Startup",
            "Modules",
            "CoordinatorArtifactsCompositionModule.Coordinator.cs");

        string text = File.ReadAllText(coordinatorArtifacts);

        text.Should().Contain("RegisterCoordinatorAuthorityAndRepositories");
        text.Should().NotContain(
            "RegisterCoordinatorDecisionEngineAndRepositories",
            "TB-305 / ADR 0042 decision D renamed coordinator-prefixed registration to authority-prefixed");
    }

    [Fact]
    public void Run_write_lifecycle_collapsed_to_three_authority_operations()
    {
        RunWriteLifecycleRoutes.All.Should().HaveCount(3);
        RunWriteLifecycleRoutes.All.Select(route => route.Operation)
            .Should()
            .BeEquivalentTo(["create", "execute", "finalize"]);
        RunWriteLifecycleRoutes.All.Should().OnlyContain(route =>
            route.CanonicalTemplate.Contains("architecture", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Coordinator_strangler_inventory_documents_code_complete_closure()
    {
        string path = Path.Combine(RepoRoot, "docs", "architecture", "COORDINATOR_STRANGLER_INVENTORY.md");
        string text = File.ReadAllText(path);

        text.Should().Contain("Improvement 3");
        text.Should().Contain("TB-919");
        text.Should().Contain("None outstanding as of 2026-07-20");
    }

    [Fact]
    public void Integration_test_canonical_run_write_guard_script_is_retired()
    {
        // TB-919 deleted the deprecated alias routes the guard protected, so the guard itself was retired
        // (a guard against calling routes that no longer exist would be permanently vacuous).
        File.Exists(Path.Combine(RepoRoot, "scripts", "ci", "assert_integration_tests_canonical_run_writes.py"))
            .Should()
            .BeFalse("TB-919 retired the alias routes and the now-vacuous guard script together");
    }

    [Fact]
    public void Deprecated_run_lifecycle_alias_middleware_is_retired()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Api", "Middleware", "RunAliasDeprecationMiddleware.cs"))
            .Should()
            .BeFalse("TB-919 deleted the deprecated alias routes and their deprecation-header middleware together");
    }

    private static bool IsArchLucidProductionSource(string path)
    {
        string normalized = path.Replace('\\', '/');

        return normalized.Contains("/ArchLucid.", StringComparison.Ordinal)
               && !normalized.Contains("/obj/", StringComparison.Ordinal)
               && !normalized.Contains("/bin/", StringComparison.Ordinal);
    }

    private static bool DefinesType(string source, string typeName) =>
        source.Contains($"class {typeName}", StringComparison.Ordinal)
        || source.Contains($"interface {typeName}", StringComparison.Ordinal)
        || source.Contains($"record {typeName}", StringComparison.Ordinal)
        || source.Contains($"struct {typeName}", StringComparison.Ordinal);

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
