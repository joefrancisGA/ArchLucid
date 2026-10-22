using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureQuickScanResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "scanId": "scan-1",
              "systemName": "Demo",
              "primaryEnvironment": "prod",
              "summary": "ok",
              "findings": null,
              "positiveObservations": null,
              "recommendedNextSteps": null,
              "completedUtc": "2026-10-15T00:00:00Z",
              "demonstrationDisclaimer": "sample"
            }
            """;

        ArchitectureQuickScanResponse response =
            JsonSerializer.Deserialize<ArchitectureQuickScanResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Findings.Should().NotBeNull().And.BeEmpty();
        response.PositiveObservations.Should().NotBeNull().And.BeEmpty();
        response.RecommendedNextSteps.Should().NotBeNull().And.BeEmpty();
    }
}
