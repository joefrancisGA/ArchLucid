using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-094: hub list and global search honor RestrictToShares visibility.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs094HubListHonorsRestrictArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As094_list_filter_adjusts_total_count_for_share_hidden_architectures()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Persistence",
            "Repositories",
            "SqlArchitectureIdentityRepository.List.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("RestrictToShares = 0");
        source.Should().Contain("s.ActorOid = @ActorOid");
        source.Should().Contain("SELECT COUNT(1)");
    }

    [Fact]
    public void As094_global_search_filter_omits_restricted_architecture_hits()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "GlobalSearchShareAccessFilter.cs");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("AS-094");
        source.Should().Contain("CanExposeArchitectureScopedHitAsync");
    }

    [Fact]
    public void As094_unit_tests_exist_for_list_count_and_global_search_filter()
    {
        string listTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Application.Tests",
            "Architecture",
            "ArchitectureIdentityServiceShareFilterTests.cs");
        string searchTests = Path.Combine(
            RepoRoot,
            "ArchLucid.Api.Tests",
            "GlobalSearchShareAccessFilterTests.cs");

        File.Exists(listTests).Should().BeTrue();
        File.Exists(searchTests).Should().BeTrue();

        File.ReadAllText(listTests).Should().Contain("ListIdentitiesAsync_hides_restricted_architecture_without_share");
        File.ReadAllText(listTests).Should().Contain("otherPage.TotalCount.Should().Be(1)");
        File.ReadAllText(searchTests).Should().Contain("FilterAsync_omits_run_and_finding_hits_for_restricted_architecture");
    }

    [Fact]
    public void As094_ui_global_search_draft_hits_filter_to_visible_architectures()
    {
        string path = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "global-search-architecture-hits.ts");

        File.Exists(path).Should().BeTrue();

        string source = File.ReadAllText(path);

        source.Should().Contain("visibleArchitectureIds");
        source.Should().Contain("architectureDraftEntryIsVisibleToActor");
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
