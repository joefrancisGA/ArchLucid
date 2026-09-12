using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-026 ratchet: Working search binds to open architecture package on nested desk; peer/global copy stays honest (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn026SearchBoundToOpenPackageArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn026_module_names_search_bind_resolvers()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-search-bound-to-open-package.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingPeerSearchRedirectHref");
        module.Should().Contain("buildSystemNotJobWorkingNestedSearchUnboundEmpty");
        module.Should().Contain("SN-026");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn026_nested_search_page_mounts_peer_search_client()
    {
        string nestedClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architectures",
                "[architectureId]",
                "search",
                "ArchitectureNestedSearchPageClient.tsx"));

        nestedClient.Should().Contain("SearchPageClient");
        nestedClient.Should().Contain("pinnedArchitectureId");
    }

    [Fact]
    public void Sn026_vitest_ratchet_names_nested_empty_and_global_copy()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-search-bound-to-open-package.test.ts"));

        test.Should().Contain("SN-026");
        test.Should().Contain("nested search");
        test.Should().Contain("header");
        test.Should().Contain("0079");
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

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
