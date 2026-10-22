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

        string source = ArchitectureSourceProbe.ReadPathWithPartials(path);

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

        string source = ArchitectureSourceProbe.ReadPathWithPartials(path);

        source.Should().Contain("wires livelihood document guards when the grant form is dirty");
        source.Should().Contain("requires confirm restrict before saving restrict-to-shares");
        source.Should().Contain("useLivelihoodDocumentGuardsMock");
        source.Should().Contain("architecture-identity-desk-share-restrict-hint");
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

        string source = ArchitectureSourceProbe.ReadPathWithPartials(path);

        source.Should().Contain("ListArchitectureShares");
        source.Should().Contain("PutArchitectureShare");
        source.Should().Contain("RevokeArchitectureShare");
        source.Should().Contain("EnsureArchitectureIdentityMutationSealedManifestAllowedAsync");
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
