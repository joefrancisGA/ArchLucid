using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Plugins;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Suite", "Decisioning")]
public sealed class GoldenCorpusHarnessEngineInventoryTests
{
    [Fact]
    public void Every_catalog_engine_is_registered_or_absent_with_reason()
    {
        GoldenCorpusHarnessEngineInventory.ValidateCatalogCoverage();
    }

    [Fact]
    public void Registered_count_matches_harness_contract()
    {
        GoldenCorpusHarnessEngineInventory.RegisteredEngineCount.Should().Be(47);
        GoldenCorpusHarnessEngineInventory.RegisteredEngineTypeIds.Count.Should().Be(47);
        GoldenCorpusHarnessEngineInventory.AbsentEngineReasons.Count.Should().Be(7);
        BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count.Should().Be(54);
        InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount.Should().Be(47);
        InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount.Should().Be(54);
    }

    [Fact]
    public void Registered_plus_absent_equals_catalog_engine_count()
    {
        int registered = GoldenCorpusHarnessEngineInventory.RegisteredEngineCount;
        int absent = GoldenCorpusHarnessEngineInventory.AbsentEngineReasons.Count;
        int catalog = BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count;

        (registered + absent).Should().Be(catalog, "every catalog engine must be harness-registered or absent-with-reason");
    }

    [Fact]
    public void Cross_run_diff_engines_are_registered_not_absent()
    {
        GoldenCorpusHarnessEngineInventory.RegisteredEngineTypeIds
            .Should().Contain(["requirement-cross-run-diff", "topology-cross-run-diff"]);

        GoldenCorpusHarnessEngineInventory.AbsentEngineReasons
            .Should().NotContainKey("requirement-cross-run-diff")
            .And.NotContainKey("topology-cross-run-diff");
    }
}
