using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingInspectResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "severity": 0,
              "runId": "00000000-0000-0000-0000-000000000001",
              "humanReviewStatus": 0,
              "evidence": null,
              "recommendedActions": null
            }
            """;

        FindingInspectResponse? response =
            JsonSerializer.Deserialize<FindingInspectResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Evidence.Should().NotBeNull().And.BeEmpty();
        response.RecommendedActions.Should().NotBeNull().And.BeEmpty();
    }
}
