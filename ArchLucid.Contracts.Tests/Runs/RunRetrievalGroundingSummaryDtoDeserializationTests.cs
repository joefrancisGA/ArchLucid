using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunRetrievalGroundingSummaryDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_grounding_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "traceCount": 0,
              "agentsWithTraces": null,
              "expectedAgentsMissingTraces": null,
              "topologyReferenceArchitectureExemplarDocumentIds": null
            }
            """;

        RunRetrievalGroundingSummaryDto? summary =
            JsonSerializer.Deserialize<RunRetrievalGroundingSummaryDto>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.AgentsWithTraces.Should().NotBeNull().And.BeEmpty();
        summary.ExpectedAgentsMissingTraces.Should().NotBeNull().And.BeEmpty();
        summary.TopologyReferenceArchitectureExemplarDocumentIds.Should().NotBeNull().And.BeEmpty();
    }
}
