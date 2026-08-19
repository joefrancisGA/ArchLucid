using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class CostAgentHandlerRetailGroundingTests
{
    private static CostRetailGroundingLookups CreateLookups() =>
        new(
            new InMemoryAzureRetailPriceStructuredLookup(),
            new InMemoryAwsRetailPriceStructuredLookup(),
            new InMemoryGcpRetailPriceStructuredLookup());

    [Fact]
    public void BuildUserPrompt_azure_hit_includes_retail_row_in_prompt()
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

        AgentTask task = new()
        {
            RunId = "run-1",
            AgentType = AgentType.Cost,
            Objective = "Estimate monthly spend",
        };

        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());
        string prompt = CostAgentHandler.BuildUserPrompt(
            "run-1",
            request,
            evidence,
            task,
            request.CloudProvider,
            grounding,
            []);

        prompt.Should().Contain("Azure Retail row");
        prompt.Should().Contain("Standard_D2s_v5");
        prompt.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public void BuildUserPrompt_aws_includes_price_list_block()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 AWS footprint m5.large in us-east-1",
            SystemName = "sys",
            CloudProvider = CloudProvider.Aws,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "AWS",
        };

        AgentTask task = new()
        {
            RunId = "run-1",
            AgentType = AgentType.Cost,
            Objective = "Estimate monthly spend",
        };

        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());
        string prompt = CostAgentHandler.BuildUserPrompt(
            "run-1",
            request,
            evidence,
            task,
            request.CloudProvider,
            grounding,
            []);

        prompt.Should().Contain("AWS Price List row");
        prompt.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public void BuildUserPrompt_none_provider_omits_retail_block()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 evidence-only review",
            SystemName = "sys",
            CloudProvider = CloudProvider.None,
        };

        AgentEvidencePackage evidence = new();

        AgentTask task = new()
        {
            RunId = "run-1",
            AgentType = AgentType.Cost,
            Objective = "Estimate monthly spend",
        };

        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, CreateLookups());
        string prompt = CostAgentHandler.BuildUserPrompt(
            "run-1",
            request,
            evidence,
            task,
            request.CloudProvider,
            grounding,
            []);

        prompt.Should().NotContain("Azure Retail row");
        prompt.Should().NotContain("AWS Price List row");
        prompt.Should().NotContain("groundingMissing");
    }
}
