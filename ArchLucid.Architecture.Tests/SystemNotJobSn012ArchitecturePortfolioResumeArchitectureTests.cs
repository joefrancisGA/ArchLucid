using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-012 ratchet: Working portfolio/home resume nests review jobs when architecture id is known (CD-11 leftover).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn012ArchitecturePortfolioResumeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn012_portfolio_resume_module_names_nested_resolver()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-portfolio-resume-href.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingResumeReviewHref");
        module.Should().Contain("resolveRunIdFromWorkingReviewHref");
        module.Should().Contain("SN-012");
    }

    [Fact]
    public void Sn012_runs_list_continue_last_viewed_row_uses_resume_resolver()
    {
        string row = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "RunsListContinueLastViewedRow.tsx"));

        row.Should().Contain("resolveSystemNotJobWorkingResumeReviewHref");
        row.Should().Contain("workingMode");
    }

    [Fact]
    public void Sn012_vitest_ratchet_names_nested_resume_and_peer_parser()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-portfolio-resume-href.test.ts"));

        test.Should().Contain("SN-012");
        test.Should().Contain("nests Working resume review href");
        test.Should().Contain("parses run id from nested and peer");
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
