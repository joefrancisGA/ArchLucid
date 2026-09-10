using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-100: Wave close audit document and prompt inventory ratchet.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs100WaveCloseAuditArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As100_acceptance_doc_exists_and_documents_merge_gates()
    {
        string path = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-100");
        source.Should().Contain("ADR **0084**");
        source.Should().Contain("not silently dropped");
        source.Should().Contain("NotVerifiable");
        source.Should().Contain("RestrictToShares");
        source.Should().Contain("AgentExecution:Mode");
        source.Should().Contain("Wave 23");
        source.Should().Contain("G-REAL-06");
        source.Should().Contain("IE-01");
    }

    [Fact]
    public void As100_readme_lists_shipped_wave_with_close_audit_link()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, "docs", "architecture", "README.md"));

        readme.Should().Contain("ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md");
        readme.Should().Contain("shipped");
    }

    [Fact]
    public void As100_prompt_inventory_vitest_ratchet_exists()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "architecture-spine-prompt-inventory.test.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-100");
        source.Should().Contain("architecture-spine-00-index.md");
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
