using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-027 ratchet: architecture desk Compare opens nested compare with base prefill (not empty peer page).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn027CompareEntryFromDeskArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn027_compare_entry_module_names_base_prefill_and_nested_path()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-compare-entry-from-desk.ts"));

        module.Should().Contain("resolveArchitectureDeskCompareBaseRunId");
        module.Should().Contain("resolveArchitectureDeskCompareHref");
        module.Should().Contain("architectureNestedComparePath");
        module.Should().Contain("SN-027");
    }

    [Fact]
    public void Sn027_desk_compare_action_uses_resolver_not_peer_compare_two_reviews_only()
    {
        string compareAction = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityDeskCompareAction.tsx"));

        compareAction.Should().Contain("resolveArchitectureDeskCompareHref");
        compareAction.Should().Contain("latestReviewId");
        compareAction.Should().NotContain("resolveArchitectureCompareSiblingDefaults");
    }

    [Fact]
    public void Sn027_vitest_ratchet_names_working_nested_prefill_and_single_review_base()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-compare-entry-from-desk.test.ts"));

        test.Should().Contain("SN-027");
        test.Should().Contain("nested compare");
        test.Should().Contain("single sealed child");
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
