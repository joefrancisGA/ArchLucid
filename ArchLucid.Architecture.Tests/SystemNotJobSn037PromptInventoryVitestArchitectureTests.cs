using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-037 ratchet: system-not-job prompt inventory Vitest confirms 40 numbered files + index.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn037PromptInventoryVitestArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn037_prompt_inventory_vitest_ratchet_exists()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "system-not-job-prompt-inventory.test.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("SN-037");
        source.Should().Contain("system-not-job-00-index.md");
        source.Should().Contain("toHaveLength(40)");
    }

    [Fact]
    public void Sn037_composer_prompts_reference_inventory_ratchet()
    {
        string prompts = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md"));

        prompts.Should().Contain("system-not-job-prompt-inventory.test.ts");
        prompts.Should().Contain("SN-037");
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
