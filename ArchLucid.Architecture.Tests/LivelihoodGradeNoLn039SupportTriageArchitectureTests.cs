using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LivelihoodGradeNoLn039SupportTriageArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Ln039_support_triage_runbook_distinguishes_false_hard_from_soft()
    {
        string path = Path.Combine(RepoRoot, "docs", "runbooks", "SUPPORT_PROBLEM_REPORT_TRIAGE.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("LN-039");
        source.Should().Contain("uncited hard");
        source.Should().Contain("soft infeasible");
        source.Should().Contain("Correlation");
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
