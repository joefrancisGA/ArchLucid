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
        GoldenCorpusHarnessEngineInventory.RegisteredEngineCount.Should().Be(16);
        GoldenCorpusHarnessEngineInventory.RegisteredEngineTypeIds.Count.Should().Be(16);
        GoldenCorpusHarnessEngineInventory.AbsentEngineReasons.Count.Should().Be(27);
        BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count.Should().Be(43);
    }

    [Fact]
    public void Absent_inventory_documents_cloud_and_cross_run_engines()
    {
        GoldenCorpusHarnessEngineInventory.TryGetAbsentReason("azure-inventory-reconciliation", out string? azureReason)
            .Should().BeTrue();
        azureReason.Should().Contain("inventory");

        GoldenCorpusHarnessEngineInventory.TryGetAbsentReason("requirement-cross-run-diff", out string? diffReason)
            .Should().BeTrue();
        diffReason.Should().Contain("Cross-run");
    }
}
