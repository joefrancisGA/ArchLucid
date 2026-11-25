using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiExportResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "rows": null,
              "savingsByEnvironment": null
            }
            """;

        SponsorRoiExportResponse? result =
            JsonSerializer.Deserialize<SponsorRoiExportResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Rows.Should().NotBeNull().And.BeEmpty();
        result.SavingsByEnvironment.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_populated_export_preserves_finding_and_environment_amounts()
    {
        const string json = """
            {
              "rows": [{"findingId": "finding-123", "environment": "production", "estimatedUsdSavings": 125.50}],
              "savingsByEnvironment": [{"environment": "production", "estimatedUsdSavings": 625.75}]
            }
            """;

        SponsorRoiExportResponse result =
            JsonSerializer.Deserialize<SponsorRoiExportResponse>(json, ContractJson.CamelCaseCompact)!;

        SponsorRoiExportRow row = result.Rows.Should().ContainSingle().Which;
        (row.FindingId, row.Environment).Should().Be(("finding-123", "production"));
        row.EstimatedUsdSavings.Should().Be(125.50m);
        SponsorRoiEnvironmentSavingsSlice slice = result.SavingsByEnvironment.Should().ContainSingle().Which;
        (slice.Environment, slice.EstimatedUsdSavings).Should().Be(("production", 625.75m));
    }
}
