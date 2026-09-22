using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-023 ratchet: Working splits governance register copy from nested desk findings (ADR 0079 / Alt+G).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn023FindingsAreVerbsOnTheSystemArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn023_module_names_findings_surface_resolvers()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-findings-are-verbs-on-the-system.ts"));

        module.Should().Contain("resolveSystemNotJobGovernanceFindingsPageSubtitle");
        module.Should().Contain("resolveSystemNotJobFindingsSurface");
        module.Should().Contain("SN-023");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn023_presentation_wires_working_copy_resolvers()
    {
        string presentation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "findings",
                "governance-findings-queue-presentation.ts"));

        presentation.Should().Contain("resolveSystemNotJobGovernanceFindingsPageSubtitle");
        presentation.Should().Contain("resolveSystemNotJobGovernanceFindingsClaimDiscipline");
    }

    [Fact]
    public void Sn023_vitest_ratchet_names_register_and_nested_desk_copy()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-findings-are-verbs-on-the-system.test.ts"));

        test.Should().Contain("SN-023");
        test.Should().Contain("nested-desk");
        test.Should().Contain("governance-register");
        test.Should().Contain("Alt+G");
        test.Should().Contain("0079");
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

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
