using ArchLucid.Contracts.Common;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>RC29c package-coverage batch: retail citation rows, pricing records, and Azure Search options.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc29cTests
{
    [Fact]
    public void CostRetailCitationRow_and_grounding_result_roundtrip_values()
    {
        CostRetailCitationRow citation = new(
            CloudProvider.Azure,
            "Virtual Machines",
            "eastus",
            "D4s_v5",
            412.50m,
            "USD",
            IsHeuristicFallback: true);

        citation.CloudProvider.Should().Be(CloudProvider.Azure);
        citation.IsHeuristicFallback.Should().BeTrue();

        CostRetailGroundingResult grounding = new(
            "Retail grounding block",
            [citation],
            GroundingMissing: false,
            SkippedRetailGrounding: false,
            GroundedProvider: CloudProvider.Azure);

        grounding.PromptBlock.Should().Contain("Retail");
        grounding.CitedRows.Should().ContainSingle();
        grounding.GroundedProvider.Should().Be(CloudProvider.Azure);
    }

    [Fact]
    public void GcpRetailPriceRow_exposes_structured_lookup_fields()
    {
        GcpRetailPriceRow row = new(
            "Compute Engine",
            "us-central1",
            "n2-standard-4",
            188.25m,
            "USD",
            IsHeuristicFallback: false);

        row.ServiceName.Should().Be("Compute Engine");
        row.MachineType.Should().Be("n2-standard-4");
        row.EstimatedMonthlyUsd.Should().Be(188.25m);
    }

    [Fact]
    public void AzureSearchOptions_section_path_and_properties_are_assignable()
    {
        AzureSearchOptions.SectionPath.Should().Be("Retrieval:AzureSearch");

        AzureSearchOptions options = new()
        {
            Endpoint = "https://search.example.test",
            IndexName = "retrieval-chunks",
            ApiKey = "test-key",
        };

        options.Endpoint.Should().Contain("search.example.test");
        options.IndexName.Should().Be("retrieval-chunks");
        options.ApiKey.Should().Be("test-key");
    }
}
