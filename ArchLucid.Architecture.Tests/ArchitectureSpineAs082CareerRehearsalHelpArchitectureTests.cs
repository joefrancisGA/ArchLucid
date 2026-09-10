using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-082 ratchet: Career vs Rehearsal help topic names both doors.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs082CareerRehearsalHelpArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As082_help_topic_registry_and_copy_name_both_doors()
    {
        string registry = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "product-documentation-registry-entries-operator-governance.ts"));

        registry.Should().Contain("\"slug\": \"career-vs-rehearsal\"");
        registry.Should().Contain("Career");
        registry.Should().Contain("Rehearsal");

        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "career-rehearsal-help-guide-content.ts"));

        copy.Should().Contain("Career");
        copy.Should().Contain("Rehearsal");
        copy.Should().Contain("SIMULATOR_REHEARSAL_GUIDED_WARNING");
        copy.Should().Contain("sponsor proof");
    }

    [Fact]
    public void As082_help_view_module_exists()
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
                "HelpCareerRehearsalGuideView.tsx"));

        view.Should().Contain("help-career-rehearsal-door-${door.doorId}");
        view.Should().Contain("help-career-rehearsal-simulator-honesty");
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
