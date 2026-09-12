using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-025 ratchet: Working Evidence graph binds to open architecture package — redirect when known, portfolio empty state when not (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn025GraphBoundToOpenPackageArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn025_module_names_graph_bind_resolvers()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-graph-bound-to-open-package.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingPeerGraphRedirectHref");
        module.Should().Contain("buildSystemNotJobWorkingGraphPickArchitectureEmpty");
        module.Should().Contain("SN-025");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn025_peer_redirect_wires_sn025_resolver()
    {
        string redirect = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "insights",
                "WorkingPeerGraphRedirect.tsx"));

        redirect.Should().Contain("resolveSystemNotJobWorkingPeerGraphRedirectHref");
    }

    [Fact]
    public void Sn025_vitest_ratchet_names_redirect_portfolio_and_empty_state()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-graph-bound-to-open-package.test.ts"));

        test.Should().Contain("SN-025");
        test.Should().Contain("nested graph");
        test.Should().Contain("deskBindGraph");
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
