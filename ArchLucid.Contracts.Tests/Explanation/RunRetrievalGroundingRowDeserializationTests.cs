using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class RunRetrievalGroundingRowDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "traceId": "trace-1",
              "retrievedChunkIds": null,
              "documentIds": null,
              "scoreSummaries": null
            }
            """;

        RunRetrievalGroundingRow? row =
            JsonSerializer.Deserialize<RunRetrievalGroundingRow>(json, ContractJson.CamelCaseCompact);

        row.Should().NotBeNull();
        row!.RetrievedChunkIds.Should().NotBeNull().And.BeEmpty();
        row.DocumentIds.Should().NotBeNull().And.BeEmpty();
        row.ScoreSummaries.Should().NotBeNull().And.BeEmpty();
    }
}
