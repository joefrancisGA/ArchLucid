using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-100 ratchet: career-gravity wave close audit document and prompt inventory.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg100WaveCloseAuditArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg100_acceptance_doc_exists_and_documents_done_tests()
    {
        string path = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("CG-100");
        source.Should().Contain("Career + Simulator cannot finalize");
        source.Should().Contain("AgentExecution:Mode");
        source.Should().Contain("G-REAL-06");
        source.Should().Contain("## Do not claim");
        source.Should().Contain("Insight density");
    }

    [Fact]
    public void Cg100_readme_lists_shipped_wave_with_close_audit_link()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, "docs", "architecture", "README.md"));

        readme.Should().Contain("CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md");
        readme.ToLowerInvariant().Should().Contain("career-gravity");
        readme.ToLowerInvariant().Should().Contain("shipped");
    }

    [Fact]
    public void Cg100_prompt_inventory_vitest_ratchet_exists()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "career-gravity-prompt-inventory.test.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("career-gravity-00-index.md");
        source.Should().Contain("toHaveLength(100)");
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
