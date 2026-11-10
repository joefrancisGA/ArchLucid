using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Single entry point for Api.Tests harness golden-path source-scan guards (<c>Suite=Core</c>, fifty scanner facts).
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestHarnessGoldenPathGuardTests
{
    internal const string GuardTestDotnetFilter = "FullyQualifiedName~IntegrationTestHarnessGoldenPathGuardTests";

    internal const string DocumentedCoreSuiteDotnetFilter = "dotnet test ArchLucid.Api.Tests --filter Suite=Core";

    public static IEnumerable<object[]> CatalogScanGuardFacts() =>
        IntegrationTestHarnessGoldenPathGuardCatalog.Facts
            .Where(static f => f.ScannerName.StartsWith("Scan", StringComparison.Ordinal))
            .Select(static f => new object[] { f });

    public static IEnumerable<object[]> CatalogCountGuardFacts() =>
        IntegrationTestHarnessGoldenPathGuardCatalog.Facts
            .Where(static f => f.ScannerName.StartsWith("Count", StringComparison.Ordinal) && f.Number != 35)
            .Select(static f => new object[] { f });

    [Theory]
    [MemberData(nameof(CatalogScanGuardFacts))]
    public void Catalog_scanner_reports_no_violations(IntegrationTestHarnessGoldenPathGuardCatalog.HarnessGuardFact fact)
    {
        List<string> violations = IntegrationTestHarnessGoldenPathGuardCatalogRunner.InvokeScan(fact.ScannerName);
        IntegrationTestHarnessGoldenPathGuardAssertionSupport.AssertHarnessGuardEmpty(
            violations,
            fact.Number,
            fact.Title);
    }

    [Theory]
    [MemberData(nameof(CatalogCountGuardFacts))]
    public void Catalog_counter_respects_allowlist_cap(IntegrationTestHarnessGoldenPathGuardCatalog.HarnessGuardFact fact)
    {
        int count = IntegrationTestHarnessGoldenPathGuardCatalogRunner.InvokeCount(fact.ScannerName);

        switch (fact.Number)
        {
            case 16:
                count.Should().BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxHarnessAllowlistedSourceFiles);
                break;
            case 31:
                count.Should().BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxReadFromJsonAllowlistedSourceFiles);
                break;
            case 41:
                count.Should().BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxReviewSubresourceAllowlistedSourceFiles);
                break;
            case 43:
                count.Should().BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxAuthorityAllowlistedSourceFiles);
                break;
            case 44:
                count.Should().BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxJsonDocumentAllowlistedSourceFiles);
                break;
            default:
                throw new InvalidOperationException($"Unexpected count guard fact #{fact.Number}.");
        }
    }

    [Fact]
    public void Harness_golden_path_smoke_tests_expose_enough_skippable_facts()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.CountHarnessGoldenPathSmokeSkippableFacts().Should()
            .BeGreaterThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MinHarnessGoldenPathSmokeSkippableFacts);
    }

    [Fact]
    public void Guard_catalog_lists_fifty_scanners()
    {
        IntegrationTestHarnessGoldenPathGuardCatalog.Facts.Should().HaveCount(50);
    }

    [Fact]
    public void Test_structure_documents_harness_core_and_guard_test_filters()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        string doc = File.ReadAllText(Path.Combine(repoRoot, "docs", "library", "TEST_STRUCTURE.md"));

        doc.Should().Contain(DocumentedCoreSuiteDotnetFilter);
        doc.Should().Contain(GuardTestDotnetFilter);
    }

    [Fact]
    public void Guard_catalog_fact_numbers_are_sequential_and_unique()
    {
        IReadOnlyList<IntegrationTestHarnessGoldenPathGuardCatalog.HarnessGuardFact> facts =
            IntegrationTestHarnessGoldenPathGuardCatalog.Facts;

        facts.Select(static f => f.Number).Should().OnlyHaveUniqueItems().And.BeInAscendingOrder();
        facts.Last().Number.Should().Be(facts.Count);
    }
}
