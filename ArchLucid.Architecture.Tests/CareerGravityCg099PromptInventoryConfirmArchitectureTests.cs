using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-099 ratchet: career-gravity prompt inventory Vitest confirms 100 numbered files + index.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg099PromptInventoryConfirmArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg099_prompt_inventory_vitest_ratchet_exists()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "career-gravity-prompt-inventory.test.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("CG-099");
        source.Should().Contain("career-gravity-00-index.md");
        source.Should().Contain("toHaveLength(100)");
    }

    [Fact]
    public void Cg099_composer_prompts_reference_inventory_ratchet()
    {
        string prompts = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "CAREER_GRAVITY_COMPOSER_PROMPTS.md"));

        prompts.Should().Contain("career-gravity-prompt-inventory.test.ts");
        prompts.Should().Contain("CG-099");
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
