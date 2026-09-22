using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// DW-001 ratchet: ADR 0096 Career Real never owns the tab.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DaytimeWaitDw001Adr0096ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Dw001_adr_0096_forbids_run_progress_url_and_fake_percent_complete()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0096-career-real-never-owns-the-tab.md"));

        adr.Should().Contain("**Status:** Accepted");
        adr.Should().Contain("GET /v1/runs/{runId}/progress");
        adr.Should().Contain("percentComplete");
        adr.Should().Contain("stay on this page");

        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "daytime-wait-adr-guard.test.ts"));

        guardTest.Should().Contain("DW-001 / ADR 0096");
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
