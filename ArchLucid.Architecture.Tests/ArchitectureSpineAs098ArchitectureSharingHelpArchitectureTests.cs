using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-098 ratchet: architecture sharing help topic names tenant boundary.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs098ArchitectureSharingHelpArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As098_help_topic_registry_and_copy_name_tenant_boundary()
    {
        string registry = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "product-documentation-registry-entries-operator-governance.ts"));

        registry.Should().Contain("\"slug\": \"architecture-sharing\"");
        registry.Should().Contain("restrict-to-shares");
        registry.Should().Contain("one tenant");

        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture-sharing-help-guide-content.ts"));

        copy.Should().Contain("not a second tenant");
        copy.Should().Contain("finding-comment chat");
        copy.Should().Contain("default remains open");
    }

    [Fact]
    public void As098_help_view_module_exists()
    {
        string view = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "help",
                "_sections",
                "HelpArchitectureSharingGuideView.tsx"));

        view.Should().Contain("help-architecture-sharing-not-in-product");
        view.Should().Contain("help-architecture-sharing-grandfather");
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
