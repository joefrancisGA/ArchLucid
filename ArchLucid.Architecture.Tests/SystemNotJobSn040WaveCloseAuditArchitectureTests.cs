using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-040 ratchet: system-not-job wave close audit document and prompt inventory.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn040WaveCloseAuditArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn040_acceptance_doc_exists_and_documents_done_tests()
    {
        string path = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("SN-040");
        source.Should().Contain("Spawn-locked draft is not a writable Career editor");
        source.Should().Contain("Compare remains committed-manifest");
        source.Should().Contain("Kernels unmerged");
        source.Should().Contain("G-REAL-06");
        source.Should().Contain("## Do not claim");
        source.Should().Contain("Insight density");
    }

    [Fact]
    public void Sn040_readme_lists_shipped_wave_with_close_audit_link()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, "docs", "architecture", "README.md"));

        readme.Should().Contain("SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md");
        readme.ToLowerInvariant().Should().Contain("system-not-job");
        readme.ToLowerInvariant().Should().Contain("shipped");
    }

    [Fact]
    public void Sn040_prompt_inventory_vitest_ratchet_exists()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "system-not-job-prompt-inventory.test.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("system-not-job-00-index.md");
        source.Should().Contain("toHaveLength(40)");
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
