using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
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

    [Fact]
    public void Deserialize_populated_bundle_preserves_report_and_drift_trend()
    {
        const string json = """
            {
              "sponsorReport": {"totalEstimatedUsdSavings": 625.75},
              "complianceDriftTrend": [
                {"bucketUtc": "2026-05-01T00:00:00Z", "changeCount": 5}
              ]
            }
            """;

        SponsorDashboardBundleResponse result =
            JsonSerializer.Deserialize<SponsorDashboardBundleResponse>(json, ContractJson.CamelCaseCompact)!;

        result.SponsorReport.TotalEstimatedUsdSavings.Should().Be(625.75m);
        ComplianceDriftTrendPoint drift = result.ComplianceDriftTrend.Should().ContainSingle().Which;
        drift.BucketUtc.Should().Be(new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc));
        drift.ChangeCount.Should().Be(5);
    }
}
