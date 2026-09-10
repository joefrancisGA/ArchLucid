using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-073 ratchet: livelihood exhibit test for ARM excerpt vs opposite claim → Unsupported.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs073HeuristicMismatchArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string DecisioningTestRelativePath =
        "ArchLucid.Decisioning.Tests/Findings/ArchitectureSpineAs073HeuristicMismatchArchitectureTests.cs";

    [Fact]
    public void As073_livelihood_exhibit_test_file_exists_for_as100_citation()
    {
        string path = Path.Combine(RepoRoot, DecisioningTestRelativePath);
        File.Exists(path).Should().BeTrue($"AS-100 must cite AS-073 exhibit at {DecisioningTestRelativePath}");
    }

    [Fact]
    public void As073_livelihood_exhibit_asserts_unsupported_without_checklist_demotion()
    {
        string source = File.ReadAllText(Path.Combine(RepoRoot, DecisioningTestRelativePath));

        source.Should().Contain("AS-073");
        source.Should().Contain("AS-100");
        source.Should().Contain("FindingSemanticSupportBand.Unsupported");
        source.Should().Contain("DecisionGradeFinding");
        source.Should().Contain("DemoteToChecklist");
        source.Should().Contain(" — ");
        source.Should().Contain("/subscriptions/");
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
