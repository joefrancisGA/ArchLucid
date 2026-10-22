using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class FindingEvidenceChainResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_forensic_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "findingId": "finding-1",
              "relatedGraphNodeIds": null,
              "agentExecutionTraceIds": null,
              "retrievalGroundingTraceIds": null,
              "agentTracePointers": null,
              "retrievalGroundingPointers": null,
              "auditCorrelationIds": null
            }
            """;

        FindingEvidenceChainResponse response =
            JsonSerializer.Deserialize<FindingEvidenceChainResponse>(json, ContractJson.CamelCaseCompact)!;

        response.RelatedGraphNodeIds.Should().NotBeNull().And.BeEmpty();
        response.AgentExecutionTraceIds.Should().NotBeNull().And.BeEmpty();
        response.RetrievalGroundingTraceIds.Should().NotBeNull().And.BeEmpty();
        response.AgentTracePointers.Should().NotBeNull().And.BeEmpty();
        response.RetrievalGroundingPointers.Should().NotBeNull().And.BeEmpty();
        response.AuditCorrelationIds.Should().NotBeNull().And.BeEmpty();
    }
}
