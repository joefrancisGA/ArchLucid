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

        InMemoryAzureRetailPriceStructuredLookup lookup = new();
        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, lookup);
        string prompt = CostAgentHandler.BuildUserPrompt("run-1", request, evidence, task, grounding);

        prompt.Should().Contain("Azure Retail row");
        prompt.Should().Contain("Standard_D2s_v5");
        prompt.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public void BuildUserPrompt_non_azure_omits_retail_block()
    {
        ArchitectureRequest request = new()
        {
            Description = "0123456789 multi-cloud review",
            SystemName = "sys",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            CloudProvider = "GCP",
        };

        AgentTask task = new()
        {
            RunId = "run-1",
            AgentType = AgentType.Cost,
            Objective = "Estimate monthly spend",
        };

        InMemoryAzureRetailPriceStructuredLookup lookup = new();
        CostRetailGroundingResult grounding = CostRetailGroundingBuilder.Build(request, evidence, lookup);
        string prompt = CostAgentHandler.BuildUserPrompt("run-1", request, evidence, task, grounding);

        prompt.Should().NotContain("Azure Retail row");
        prompt.Should().NotContain("groundingMissing");
    }
}
