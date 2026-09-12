using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-021 ratchet: Working primary chrome shows architecture names; run ids stay in disclosures (ADR 0074).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn021RunIdNotInWorkingPrimaryChromeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn021_module_names_working_primary_list_title_resolver()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-run-id-not-in-working-primary-chrome.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingPrimaryListTitle");
        module.Should().Contain("SN-021");
        module.Should().Contain("0074");
    }

    [Fact]
    public void Sn021_disambiguator_suppresses_run_id_suffix_in_working_mode()
    {
        string disambiguator = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "operator", "run-home-list-disambiguator.ts"));

        disambiguator.Should().Contain("workingMode");
        disambiguator.Should().Contain("SN-021");
    }

    [Fact]
    public void Sn021_vitest_ratchet_names_working_hub_inventory_and_guided_fallback()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-run-id-not-in-working-primary-chrome.test.ts"));

        test.Should().Contain("SN-021");
        test.Should().Contain("resolveSystemNotJobWorkingPrimaryListTitle");
        test.Should().Contain("isWorkingMode: true");
        test.Should().Contain("248324");
        test.Should().Contain("0074");
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
