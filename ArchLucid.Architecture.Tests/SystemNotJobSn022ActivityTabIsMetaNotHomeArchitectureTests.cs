using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-022 ratchet: Working review workspace defaults to overview/findings; Activity stays meta (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn022ActivityTabIsMetaNotHomeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn022_module_names_working_default_tab_resolver()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-activity-tab-is-meta-not-home.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingReviewDetailDefaultTab");
        module.Should().Contain("SN-022");
        module.Should().Contain("0079");
    }

    [Fact]
    public void Sn022_visible_tabs_wires_working_default_resolver()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "resolve-review-detail-visible-tabs.ts"));

        resolver.Should().Contain("resolveSystemNotJobWorkingReviewDetailDefaultTab");
    }

    [Fact]
    public void Sn022_vitest_ratchet_names_working_overview_default_and_guided_activity()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-activity-tab-is-meta-not-home.test.ts"));

        test.Should().Contain("SN-022");
        test.Should().Contain("resolveSystemNotJobWorkingReviewDetailDefaultTab");
        test.Should().Contain("workingDesk: true");
        test.Should().Contain("defaultTabId).toBe(\"activity\")");
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
