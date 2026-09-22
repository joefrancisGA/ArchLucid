using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-029 ratchet: Working portfolio lists open drafts and save-and-exit lands on the drafts band (IA-002).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn029DraftListReachableFromPortfolioArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn029_module_names_portfolio_anchor_save_exit_and_owner()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-draft-list-reachable-from-portfolio.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingPortfolioSaveAndExitHref");
        module.Should().Contain("working-portfolio-open-drafts");
        module.Should().Contain("SN-029");
    }

    [Fact]
    public void Sn029_working_portfolio_lists_drafts_beside_identity_inventory()
    {
        string listSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architectures",
                "_sections",
                "ArchitecturesHubListSection.tsx"));

        listSection.Should().Contain("ArchitectureWorkingPortfolioDraftsSection");
        listSection.Should().Contain("ArchitectureIdentityListClient");
    }

    [Fact]
    public void Sn029_save_and_exit_uses_working_portfolio_anchor()
    {
        string saveActions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureDraftWorkspaceSaveActions.tsx"));

        saveActions.Should().Contain("resolveSystemNotJobWorkingPortfolioSaveAndExitHref");
    }

    [Fact]
    public void Sn029_vitest_ratchet_names_save_exit_anchor_and_open_drafts_filter()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-draft-list-reachable-from-portfolio.test.ts"));

        test.Should().Contain("SN-029");
        test.Should().Contain("save-and-exit");
        test.Should().Contain("non-archived");
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
