using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-024 ratchet: Working Ask binds to open architecture package — redirect when known, portfolio empty state when not (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn024AskBoundToOpenPackageArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn024_module_names_ask_bind_resolvers()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-ask-bound-to-open-package.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingPeerAskRedirectHref");
        module.Should().Contain("buildSystemNotJobWorkingAskPickArchitectureEmpty");
        module.Should().Contain("SN-024");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn024_peer_redirect_wires_sn024_resolver()
    {
        string redirect = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "insights",
                "WorkingPeerAskRedirect.tsx"));

        redirect.Should().Contain("resolveSystemNotJobWorkingPeerAskRedirectHref");
    }

    [Fact]
    public void Sn024_vitest_ratchet_names_redirect_portfolio_and_empty_state()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-ask-bound-to-open-package.test.ts"));

        test.Should().Contain("SN-024");
        test.Should().Contain("nested Ask");
        test.Should().Contain("deskBindAsk");
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
