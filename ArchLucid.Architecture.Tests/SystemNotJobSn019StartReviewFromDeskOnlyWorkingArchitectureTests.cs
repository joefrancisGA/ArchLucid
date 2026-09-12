using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-019 ratchet: Working Alt+N / New review creates under open architecture, not floating peer jobs (ADR 0077).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn019StartReviewFromDeskOnlyWorkingArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn019_module_names_nested_create_resolver()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-start-review-from-desk-only-working.ts"));

        module.Should().Contain("resolveWorkingCreateStartHref");
        module.Should().Contain("startReviewFromArchitectureNestedHref");
        module.Should().Contain("SN-019");
    }

    [Fact]
    public void Sn019_create_hook_wires_nested_resolver_for_alt_n()
    {
        string hook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-working-start-href.ts"));

        hook.Should().Contain("useWorkingCreateStartHref");
        hook.Should().Contain("resolveWorkingCreateStartHref");
    }

    [Fact]
    public void Sn019_vitest_ratchet_names_nested_create_and_portfolio_fallback()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-start-review-from-desk-only-working.test.ts"));

        test.Should().Contain("SN-019");
        test.Should().Contain("nested-under-open-architecture");
        test.Should().Contain("portfolio-new");
        test.Should().Contain("0077");
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
