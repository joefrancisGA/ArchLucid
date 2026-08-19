using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class CostRetailGroundingBuilderTests
{
    private static CostRetailGroundingLookups CreateLookups(
        IEnumerable<AzureRetailPriceRow>? azureRows = null,
        IEnumerable<AwsRetailPriceRow>? awsRows = null,
        IEnumerable<GcpRetailPriceRow>? gcpRows = null)
    {
        return new CostRetailGroundingLookups(
            new InMemoryAzureRetailPriceStructuredLookup(azureRows),
            new InMemoryAwsRetailPriceStructuredLookup(awsRows),
            new InMemoryGcpRetailPriceStructuredLookup(gcpRows));
    }

    [Fact]
    public void Build_none_provider_skips_retail_attribution()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 evidence-only review",
            SystemName = "sys",
            CloudProvider = CloudProvider.None,
        };

        AgentEvidencePackage evidence = new();

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());

        result.SkippedRetailGrounding.Should().BeTrue();
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

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());

        result.SkippedRetailGrounding.Should().BeFalse();
        result.GroundedProvider.Should().Be(CloudProvider.Azure);
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

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(
            request,
            evidence,
            CreateLookups(azureRows: []));

        result.GroundingMissing.Should().BeTrue();
        result.PromptBlock.Should().Contain("groundingMissing: true");
    }

    [Fact]
    public void Build_aws_evidence_uses_price_list_grounding()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 AWS landing zone with m5.large in us-east-1",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "AWS",
        };

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());

        result.SkippedRetailGrounding.Should().BeFalse();
        result.GroundedProvider.Should().Be(CloudProvider.Aws);
        result.GroundingMissing.Should().BeFalse();
        result.CitedRows.Should().Contain(row => row.CloudProvider == CloudProvider.Aws);
        result.PromptBlock.Should().Contain("AWS Price List grounding");
        result.PromptBlock.Should().Contain("m5.large");
        result.PromptBlock.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public void Build_effective_cloud_target_overrides_request_and_evidence()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 Azure footprint Standard_D2s_v5 in eastus",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "Azure",
        };

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(
            request,
            evidence,
            CreateLookups(),
            CloudProvider.Aws);

        result.SkippedRetailGrounding.Should().BeFalse();
        result.GroundedProvider.Should().Be(CloudProvider.Aws);
        result.PromptBlock.Should().Contain("AWS Price List grounding");
        result.PromptBlock.Should().NotContain("Azure Retail Prices grounding");
    }

    [Fact]
    public void Build_effective_cloud_neutral_skips_evidence_provider_hints()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 evidence-only review",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "AWS",
        };

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(
            request,
            evidence,
            CreateLookups(),
            CloudProvider.None);

        result.SkippedRetailGrounding.Should().BeTrue();
        result.GroundedProvider.Should().BeNull();
        result.CitedRows.Should().BeEmpty();
    }

    [Fact]
    public void Build_gcp_request_uses_billing_catalog_grounding()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 GCP footprint with n1-standard-2 in us-central1",
            SystemName = "sys",
            CloudProvider = CloudProvider.Gcp,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "GCP",
        };

        CostRetailGroundingResult result = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());

        result.SkippedRetailGrounding.Should().BeFalse();
        result.GroundedProvider.Should().Be(CloudProvider.Gcp);
        result.GroundingMissing.Should().BeFalse();
        result.CitedRows.Should().Contain(row => row.CloudProvider == CloudProvider.Gcp);
        result.PromptBlock.Should().Contain("GCP Cloud Billing Catalog grounding");
        result.PromptBlock.Should().Contain("n1-standard-2");
    }
}
