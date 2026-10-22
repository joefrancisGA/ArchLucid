using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class RunRetrievalGroundingResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_rows_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "rows": null,
              "traceCount": 0,
              "hasDegradedMetadata": false
            }
            """;

        RunRetrievalGroundingResponse? response =
            JsonSerializer.Deserialize<RunRetrievalGroundingResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Rows.Should().NotBeNull().And.BeEmpty();
    }
}
