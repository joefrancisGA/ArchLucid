using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-2161 — container host projects must ship zero-cost runtime knobs.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostRuntimeKnobsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] HostProjectPaths =
    [
        "ArchLucid.Api/ArchLucid.Api.csproj",
        "ArchLucid.Worker/ArchLucid.Worker.csproj",
        "ArchLucid.Jobs.Cli/ArchLucid.Jobs.Cli.csproj",
    ];

    [Fact]
    public void Tb2161_host_runtime_props_declares_server_gc_tiered_pgo_and_full_globalization()
    {
        string propsPath = Path.Combine(RepoRoot, "ArchLucid.Host.Runtime.props");

        File.Exists(propsPath).Should().BeTrue();

        string propsText = File.ReadAllText(propsPath);

        propsText.Should().Contain("<ServerGarbageCollection>true</ServerGarbageCollection>");
        propsText.Should().Contain("<TieredPGO>true</TieredPGO>");
        // SqlClient cannot open connections when System.Globalization.Invariant is true.
        propsText.Should().Contain("<InvariantGlobalization>false</InvariantGlobalization>");
        propsText.Should().Contain("<GCConserveMemory>1</GCConserveMemory>");
    }

    [Fact]
    public void Tb2161_host_projects_import_shared_runtime_props()
    {
        foreach (string relativePath in HostProjectPaths)
        {
            string path = Path.Combine(RepoRoot, relativePath);
            string text = File.ReadAllText(path);

            text.Should().Contain(
                @"Import Project=""..\ArchLucid.Host.Runtime.props""",
                $"host project {relativePath} must import ArchLucid.Host.Runtime.props");
        }
    }

    [Fact]
    public void Tb2161_api_dockerfile_keeps_icu_and_disables_invariant_globalization()
    {
        string dockerfilePath = Path.Combine(RepoRoot, "ArchLucid.Api", "Dockerfile");
        string dockerfileText = File.ReadAllText(dockerfilePath);

        dockerfileText.Should().Contain("ArchLucid.Host.Runtime.props");
        dockerfileText.Should().Contain("DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false");
        dockerfileText.Should().Contain("icu-libs");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
