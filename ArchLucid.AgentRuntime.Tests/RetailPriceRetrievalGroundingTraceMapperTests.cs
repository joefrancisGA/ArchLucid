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
    public void BuildInsert_maps_azure_retail_rows_to_cost_agent_trace()
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
            [new CostRetailCitationRow(CloudProvider.Azure, "Virtual Machines", "eastus", "Standard_D2s_v5", 0.12m, "USD")],
            GroundingMissing: false,
            SkippedRetailGrounding: false,
            GroundedProvider: CloudProvider.Azure);

        RetrievalGroundingTraceInsert insert = RetailPriceRetrievalGroundingTraceMapper.BuildInsert(
            scope,
            Guid.NewGuid(),
            request,
            grounding);

        insert.AgentName.Should().Be(RetailPriceRetrievalGroundingTraceMapper.CostAgentName);
        insert.CorpusKind.Should().Be(RetailPriceRetrievalGroundingTraceMapper.AzureRetailCorpusKind);
        insert.RetrievedChunkIds.Should().NotBeEmpty();
    }

    [Fact]
    public void BuildInsert_maps_aws_retail_rows_to_aws_corpus_kind()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ArchitectureRequest request = new()
        {
            Description = "AWS web tier",
            CloudProvider = CloudProvider.Aws,
        };

        CostRetailGroundingResult grounding = new(
            "block",
            [new CostRetailCitationRow(CloudProvider.Aws, "AmazonEC2", "us-east-1", "m5.large", 70m, "USD")],
            GroundingMissing: false,
            SkippedRetailGrounding: false,
            GroundedProvider: CloudProvider.Aws);

        RetrievalGroundingTraceInsert insert = RetailPriceRetrievalGroundingTraceMapper.BuildInsert(
            scope,
            Guid.NewGuid(),
            request,
            grounding);

        insert.CorpusKind.Should().Be(RetailPriceRetrievalGroundingTraceMapper.AwsRetailCorpusKind);
    }
}
