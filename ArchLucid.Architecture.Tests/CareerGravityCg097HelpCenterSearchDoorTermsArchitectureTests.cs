using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-097 ratchet: help search aliases surface Working Career/Rehearsal door topic.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg097HelpCenterSearchDoorTermsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg097_help_drawer_aliases_map_door_terms_to_topic()
    {
        string topics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "help",
                "help-search-panel-catalog-topics.ts"));
        string registry = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "product-documentation-registry-entries-operator-workspace.ts"));

        topics.Should().Contain("simulator: [\"career-rehearsal-doors\"]");
        topics.Should().Contain("\"career door\": [\"career-rehearsal-doors\"]");
        topics.Should().Contain("rehearsal: [\"career-rehearsal-doors\"]");
        topics.Should().Contain("\"career-complete\": [\"career-rehearsal-doors\"]");
        topics.Should().Contain("id: \"career-rehearsal-doors\"");
        registry.Should().Contain("\"slug\": \"career-rehearsal-doors\"");
        registry.Should().Contain("career door");
        registry.Should().Contain("career-complete");
    }

    [Fact]
    public void Cg097_docs_record_help_search_door_aliases()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-097");
        docs.Should().Contain("Help search finds Career/Rehearsal terms");
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
