using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class WhyArchLucidSnapshotResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_produced_by_severity_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "generatedUtc": "2026-10-29T12:00:00Z",
              "demoRunId": "run-demo",
              "runsCreatedTotal": 0,
              "findingsProducedBySeverity": null,
              "auditRowCount": 0,
              "auditRowCountTruncated": false,
              "estimatedManualWorkHoursSaved": 0,
              "estimatedManualWorkHoursSavedMethodology": ""
            }
            """;

        WhyArchLucidSnapshotResponse? response =
            JsonSerializer.Deserialize<WhyArchLucidSnapshotResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.FindingsProducedBySeverity.Should().NotBeNull().And.BeEmpty();
    }
}
