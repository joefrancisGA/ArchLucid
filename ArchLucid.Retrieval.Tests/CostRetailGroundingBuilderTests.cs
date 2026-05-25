using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class CostRetailGroundingBuilderTests
{
    [Fact]
    public void Build_non_azure_provider_skips_retail_attribution()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 AWS landing zone cost review",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "AWS",
        };

        InMemoryAzureRetailPriceStructuredLookup lookup = new();

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, lookup);

        result.SkippedNonAzure.Should().BeTrue();
        result.GroundingMissing.Should().BeFalse();
        result.CitedRows.Should().BeEmpty();
    }

    [Fact]
    public void Build_azure_catalog_hit_includes_retail_row_in_prompt_block()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 Azure app service footprint in eastus using Standard_D2s_v5",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "Azure",
        };

        InMemoryAzureRetailPriceStructuredLookup lookup = new();

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, lookup);

        result.SkippedNonAzure.Should().BeFalse();
        result.GroundingMissing.Should().BeFalse();
        result.CitedRows.Should().NotBeEmpty();
        result.PromptBlock.Should().Contain("Standard_D2s_v5");
        result.PromptBlock.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public void Build_azure_catalog_miss_sets_groundingMissing()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 Azure footprint in westeurope",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["SKU: Standard_UnknownSku_xyz"],
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "Azure",
        };

        InMemoryAzureRetailPriceStructuredLookup lookup = new(seedRows: []);

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, lookup);

        result.GroundingMissing.Should().BeTrue();
        result.PromptBlock.Should().Contain("groundingMissing: true");
    }
}
