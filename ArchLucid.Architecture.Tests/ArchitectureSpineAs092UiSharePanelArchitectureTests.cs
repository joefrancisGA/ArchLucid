using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-092: Working desk share panel UI and share CRUD endpoints.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs092UiSharePanelArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As092_share_panel_component_exists_with_livelihood_guards()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "components",
            "architecture",
            "ArchitectureIdentityDeskSharePanel.tsx");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-092");
        source.Should().Contain("useLivelihoodDocumentGuards");
        source.Should().Contain("LivelihoodDocumentGuardDialog");
        source.Should().Contain("architecture-identity-desk-share");
    }

    [Fact]
    public void As092_share_panel_vitest_covers_dirty_guard_and_restrict_confirm()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "components",
            "architecture",
            "ArchitectureIdentityDeskSharePanel.test.tsx");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-092");
        source.Should().Contain("livelihood guards");
        source.Should().Contain("opt-in confirmation");
        source.Should().Contain("TB-2005");
    }

    [Fact]
    public void As092_share_crud_endpoints_exist_on_architectures_controller()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Api",
            "Controllers",
            "Architecture",
            "ArchitecturesController.Shares.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("ListShares");
        source.Should().Contain("UpsertShare");
        source.Should().Contain("DeleteShare");
        source.Should().Contain("EnsureArchitectureShareAdminAllowedAsync");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
