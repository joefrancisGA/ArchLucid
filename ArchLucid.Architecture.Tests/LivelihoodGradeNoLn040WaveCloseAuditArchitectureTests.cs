using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LivelihoodGradeNoLn040WaveCloseAuditArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Ln040_acceptance_doc_exists_and_documents_done_tests()
    {
        string path = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "LIVELIHOOD_GRADE_NO_ACCEPTANCE_2026-09-11.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("LN-040");
        source.Should().Contain("Uncited hard cannot export");
        source.Should().Contain("G-REAL-06");
        source.Should().Contain("Insight density");
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
