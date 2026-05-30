using System.Reflection;

using ArchLucid.Application;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-013: replay orchestration must read the source run and persist outputs under a distinct replay run id.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ReplayReadOnlyScopeArchitectureTests
{
    [Fact]
    public void ReplayRunService_depends_on_run_detail_query_service_for_source_hydration()
    {
        Type serviceType = typeof(ReplayRunService);
        ConstructorInfo? ctor = serviceType.GetConstructors(BindingFlags.Instance | BindingFlags.Public).FirstOrDefault();

        ctor.Should().NotBeNull();

        bool hasRunDetailQuery = ctor!
            .GetParameters()
            .Any(static parameter => parameter.ParameterType.Name.Contains("IRunDetailQueryService", StringComparison.Ordinal));

        hasRunDetailQuery.Should().BeTrue(
            "INV-013 replay must hydrate the original run through the shared read model before writing replay outputs.");
    }

    [Fact]
    public void ReplayRunService_depends_on_authority_run_repository_for_distinct_replay_persistence()
    {
        Type serviceType = typeof(ReplayRunService);
        ConstructorInfo? ctor = serviceType.GetConstructors(BindingFlags.Instance | BindingFlags.Public).FirstOrDefault();

        ctor.Should().NotBeNull();

        bool hasRunRepository = ctor!
            .GetParameters()
            .Any(static parameter => parameter.ParameterType.Name.Contains("IRunRepository", StringComparison.Ordinal));

        hasRunRepository.Should().BeTrue(
            "INV-013 replay outputs must persist under a separate authority run row, not mutate the original.");
    }

    [Fact]
    public void Inv_013_integration_guard_source_file_exists()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(
            root,
            "ArchLucid.Api.Tests",
            "ReplayCommitOriginalGoldenManifestIsolationIntegrationTests.cs");

        File.Exists(path).Should().BeTrue(
            "INV-013 requires ReplayCommitOriginalGoldenManifestIsolationIntegrationTests in ArchLucid.Api.Tests.");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
