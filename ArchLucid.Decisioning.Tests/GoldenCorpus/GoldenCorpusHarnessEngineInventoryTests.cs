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
        GoldenCorpusHarnessEngineInventory.RegisteredEngineCount.Should().Be(43);
        GoldenCorpusHarnessEngineInventory.RegisteredEngineTypeIds.Count.Should().Be(43);
        GoldenCorpusHarnessEngineInventory.AbsentEngineReasons.Count.Should().Be(11);
        BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count.Should().Be(54);
        InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount.Should().Be(43);
        InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount.Should().Be(54);
    }

    [Fact]
    public void Absent_inventory_documents_cloud_and_cross_run_engines()
    {
        GoldenCorpusHarnessEngineInventory.TryGetAbsentReason("requirement-cross-run-diff", out string? diffReason)
            .Should().BeTrue();
        diffReason.Should().Contain("Cross-run");
    }
}
