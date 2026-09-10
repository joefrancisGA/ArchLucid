using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-083 ratchet: CLI try flags use Career / Rehearsal door vocabulary aligned with UI.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs083CliTryRealVsRehearseArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string TryOptionsRelativePath = "ArchLucid.Cli/Commands/TryCommandOptions.cs";

    private const string TryHelpRelativePath = "ArchLucid.Cli/Commands/TryCommandHelp.cs";

    private const string ValidateConfigAgentsRelativePath =
        "ArchLucid.Cli/Commands/ValidateConfigEvaluator.StorageAndAgents.cs";

    [Fact]
    public void As083_try_options_define_real_and_rehearse_flags()
    {
        string options = File.ReadAllText(Path.Combine(RepoRoot, TryOptionsRelativePath));

        options.Should().Contain("--real");
        options.Should().Contain("--rehearse");
        options.Should().Contain("TryCommandExecutionDoor.Career");
        options.Should().Contain("TryCommandExecutionDoor.Rehearsal");
        options.Should().Contain("AS-083");
    }

    [Fact]
    public void As083_try_help_names_career_and_rehearsal_doors()
    {
        string help = File.ReadAllText(Path.Combine(RepoRoot, TryHelpRelativePath));

        help.Should().Contain("Career");
        help.Should().Contain("Rehearsal");
        help.Should().Contain("Simulator");
        help.Should().Contain("archlucid try --rehearse");
        help.Should().Contain("archlucid try --real");
    }

    [Fact]
    public void As083_validate_config_mode_check_mentions_cli_doors()
    {
        string evaluator = File.ReadAllText(Path.Combine(RepoRoot, ValidateConfigAgentsRelativePath));

        evaluator.Should().Contain("Career door");
        evaluator.Should().Contain("Rehearsal door");
        evaluator.Should().Contain("archlucid try --real");
        evaluator.Should().Contain("archlucid try --rehearse");
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
