using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotReportCardDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_by_severity_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingsBySeverity": null
            }
            """;

        PilotReportCard? result =
            JsonSerializer.Deserialize<PilotReportCard>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FindingsBySeverity.Should().NotBeNull().And.BeEmpty();
    }
}
