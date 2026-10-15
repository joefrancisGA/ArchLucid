using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorDashboardBundleResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_compliance_drift_trend_yields_empty_list_not_null()
    {
        const string json = """
            {
              "complianceDriftTrend": null
            }
            """;

        SponsorDashboardBundleResponse? result =
            JsonSerializer.Deserialize<SponsorDashboardBundleResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ComplianceDriftTrend.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_sponsor_report_yields_non_null_report_not_null()
    {
        const string json = """
            {
              "sponsorReport": null
            }
            """;

        SponsorDashboardBundleResponse? result =
            JsonSerializer.Deserialize<SponsorDashboardBundleResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SponsorReport.Should().NotBeNull();
    }
}
