using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-073 ratchet: livelihood exhibit test for ARM citation quote mismatch → Unsupported.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs073HeuristicMismatchUnsupportedArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As073_livelihood_exhibit_test_exists_in_decisioning_tests()
    {
        string testPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Decisioning.Tests",
            "Findings",
            "FindingSemanticSupportBandScorerAs073LivelihoodExhibitTests.cs");

        File.Exists(testPath).Should().BeTrue();

        string source = File.ReadAllText(testPath);

        source.Should().Contain("As073_arm_citation_with_opposite_message_scores_unsupported");
        source.Should().Contain("Anonymous internet callers");
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
