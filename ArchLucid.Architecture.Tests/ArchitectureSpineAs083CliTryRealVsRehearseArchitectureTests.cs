using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-083 ratchet: CLI Rehearsal vocabulary aligns with Working doors.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs083CliTryRealVsRehearseArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As083_real_mode_smoke_accepts_rehearse_alias_without_aoai_requirement()
    {
        string options = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "RealModeSmokeCommandOptions.cs"));

        options.Should().Contain("\"--rehearse\"");
        options.Should().Contain("allowSimulator = true");
    }

    [Fact]
    public void As083_cli_usage_and_validate_config_use_career_rehearsal_vocabulary()
    {
        string usage = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "RealModeSmokeCommand.cs"));

        usage.Should().Contain("--rehearse");
        usage.Should().Contain("Rehearsal door");
        usage.Should().Contain("Career path");

        string validateConfig = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Commands", "ValidateConfigEvaluator.StorageAndAgents.cs"));

        validateConfig.Should().Contain("Rehearsal door");
        validateConfig.Should().Contain("Career path");
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
