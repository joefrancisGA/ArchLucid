using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-001 ratchet: ADR 0092 cheap labeled envelope; no draft Compare as Career; kernels unmerged.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn001Adr0092ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn001_adr_0092_forbids_draft_compare_and_allows_labeled_envelope()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0092-working-cheap-what-if-envelope.md"));

        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("May we Compare two unsealed drafts as Career?");
        adr.Should().Contain("May Working sketch a labeled envelope?");
        adr.Should().Contain("authority-borrowing");
        adr.Should().MatchRegex("Do not.*merge.*DraftRequests.*Runs");
        adr.Should().Contain("G-REAL-06");
    }

    [Fact]
    public void Sn001_guard_inventory_and_vitest_exist()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-adr-inventory.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-adr-guard.test.ts"));

        inventory.Should().Contain("SYSTEM_NOT_JOB_ADR_0092_RELATIVE_PATH");
        inventory.Should().Contain("0092-working-cheap-what-if-envelope.md");
        guardTest.Should().Contain("SN-001 / ADR 0092");
        guardTest.Should().Contain("May we Compare two unsealed drafts as Career\\?");
    }

    [Fact]
    public void Sn001_readme_lists_adr_0092()
    {
        string readme = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "README.md"));

        readme.Should().Contain("0092-working-cheap-what-if-envelope.md");
        readme.Should().Contain("SN-001");
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
