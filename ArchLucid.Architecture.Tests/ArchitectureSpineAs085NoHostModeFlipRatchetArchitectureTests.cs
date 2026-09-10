using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-085 ratchet: default appsettings keep AgentExecution Mode on Simulator.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0086-career-vs-rehearsal-doors-no-host-mode-flip.md";

    private static readonly string[] DefaultModeConfigRelativePaths =
    [
        Path.Combine("ArchLucid.Api", "appsettings.json"),
    ];

    [Fact]
    public void As085_default_appsettings_keep_agent_execution_mode_simulator()
    {
        foreach (string relativePath in DefaultModeConfigRelativePaths)
        {
            string path = Path.Combine(RepoRoot, relativePath);
            File.Exists(path).Should().BeTrue(relativePath);

            string json = File.ReadAllText(path);

            json.Should().Contain("\"Mode\": \"Simulator\"", because: $"{relativePath} must not flip host default to Real (AS-085)");
        }
    }

    [Fact]
    public void As085_adr_0086_documents_no_host_default_flip()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("AS-085");
        adr.Should().Contain("Simulator");
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

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
