using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingInsightSignalStatusResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_kinds_yields_empty_list_not_null()
    {
        const string json = """
            {
              "kinds": null
            }
            """;

        FindingInsightSignalStatusResponse? response =
            JsonSerializer.Deserialize<FindingInsightSignalStatusResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Kinds.Should().NotBeNull().And.BeEmpty();
    }
}
