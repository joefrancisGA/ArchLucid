using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CE-001 ratchet: ADR 0092 cheap envelope runner on Working.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CheapExplorationCe001Adr0092ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Ce001_adr_0092_is_accepted_and_ce_runner_modules_exist()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0092-working-cheap-what-if-envelope.md"));

        adr.Should().Contain("**Status:** Accepted");
        adr.Should().Contain("labeled what-if envelope");

        string runnerModule = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "cheap-exploration-envelope-runner-entry.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "cheap-exploration-adr-guard.test.ts"));

        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "cheap-exploration-adr-inventory.ts"));

        runnerModule.Should().Contain("CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL");
        inventory.Should().Contain("Sketch a change");
        guardTest.Should().Contain("CE-001 / ADR 0092");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
