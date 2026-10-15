using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotRunDeltasResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_by_severity_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingsBySeverity": null,
              "roiMetricSources": null
            }
            """;

        PilotRunDeltasResponse? response =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.FindingsBySeverity.Should().NotBeNull().And.BeEmpty();
        response.RoiMetricSources.Should().NotBeNull().And.BeEmpty();
    }
}
