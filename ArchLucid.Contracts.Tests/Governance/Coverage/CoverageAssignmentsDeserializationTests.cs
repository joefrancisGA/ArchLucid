using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance.Coverage;

[Trait("Category", "Unit")]
public sealed class CoverageAssignmentsDeserializationTests
{
    [Fact]
    public void Deserialize_null_assignments_on_preview_result_yields_empty_list_not_null()
    {
        const string json = """
            {
              "focusedPilotModeEnabled": false,
              "summaryLine": "preview",
              "providerNeutralBaselineCount": 0,
              "organizationRequiredCount": 0,
              "platformOverlayCount": 0,
              "contextualRecommendedCount": 0,
              "additionalOptionalCount": 0,
              "assignments": null
            }
            """;

        CoveragePreviewResult? result =
            JsonSerializer.Deserialize<CoveragePreviewResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Assignments.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_assignments_on_summary_yields_empty_list_not_null()
    {
        const string json = """
            {
              "legacyCoverageNotRecorded": false,
              "providerNeutralBaselineCount": 0,
              "organizationRequiredCount": 0,
              "platformOverlayCount": 0,
              "contextualRecommendedCount": 0,
              "additionalOptionalCount": 0,
              "assignments": null
            }
            """;

        CoverageSummary? summary =
            JsonSerializer.Deserialize<CoverageSummary>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.Assignments.Should().NotBeNull().And.BeEmpty();
    }
}
