using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Pricing;

using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class RetailPriceRetrievalGroundingTraceMapperTests
{
    [Fact]
    public void BuildInsert_maps_retail_rows_to_cost_agent_trace()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ArchitectureRequest request = new()
        {
            Description = "Azure web tier",
            CloudProvider = CloudProvider.Azure,
        };

        CostRetailGroundingResult grounding = new(
            "block",
            [new AzureRetailPriceRow("Virtual Machines", "Compute", "eastus", "Standard_D2s_v5", 0.12m, "USD")],
            GroundingMissing: false,
            SkippedNonAzure: false);

        RetrievalGroundingTraceInsert insert = RetailPriceRetrievalGroundingTraceMapper.BuildInsert(
            scope,
            Guid.NewGuid(),
            request,
            grounding);

        insert.AgentName.Should().Be(RetailPriceRetrievalGroundingTraceMapper.CostAgentName);
        insert.CorpusKind.Should().Be(RetailPriceRetrievalGroundingTraceMapper.AzureRetailCorpusKind);
        insert.RetrievedChunkIds.Should().NotBeEmpty();
    }
}
