using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-098: In-app help names architecture-share boundary — one tenant, not chat or presence.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs098HelpShareNotSecondTenantArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As098_help_guide_content_names_product_boundary()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "architecture",
            "architecture-share-restrict-help-guide-content.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-098");
        source.Should().Contain("second tenant");
        source.Should().Contain("Not chat or live presence");
        source.Should().Contain("restrict-to-shares");
    }

    [Fact]
    public void As098_help_topic_registered_and_routed()
    {
        string loader = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "help",
            "help-topic-content-loader.ts");
        string resolver = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "help",
            "help-topic-view-resolver-operate.tsx");

        File.ReadAllText(loader).Should().Contain("architecture-sharing");
        File.ReadAllText(resolver).Should().Contain("HelpArchitectureShareRestrictGuideView");
    }

    [Fact]
    public void As098_share_contract_documents_help_boundary_row()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "ARCHITECTURE_SHARE_ACL_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-098");
        source.Should().Contain("ArchitectureSpineAs098HelpShareNotSecondTenantArchitectureTests");
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
