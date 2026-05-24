using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Configuration")]
public sealed class RoiExportCommandTests
{
    [Fact]
    public void BuildCsv_includes_rows_and_environment_slices()
    {
        ExecutiveRoiExportResponse export = new()
        {
            Rows =
            [
                new ExecutiveRoiExportRow
                {
                    FindingId = "f-1",
                    RunId = Guid.Empty.ToString("D"),
                    SystemName = "Billing",
                    Environment = "prod",
                    Category = "Cost",
                    Severity = "High",
                    Title = "Oversized SKU",
                    EstimatedUsdSavings = 1200m
                }
            ],
            SavingsByEnvironment =
            [
                new ExecutiveRoiEnvironmentSavingsSlice { Environment = "prod", EstimatedUsdSavings = 1200m }
            ]
        };

        string csv = RoiExportCommand.BuildCsv(export);

        csv.Should().Contain("FindingId,RunId,SystemName");
        csv.Should().Contain("f-1");
        csv.Should().Contain("Environment,EstimatedUsdSavings");
        csv.Should().Contain("prod,1200");
    }
}

[Trait("Suite", "Configuration")]
public sealed class ComplianceExportDriftCommandTests
{
    [Fact]
    public void BuildCsv_formats_trend_points()
    {
        List<ComplianceDriftTrendPoint> points =
        [
            new()
            {
                BucketUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ChangeCount = 2,
                OpenFindingsCount = 5,
                ResolvedFindingsCount = 1,
                ChangesByType = new Dictionary<string, int> { ["PackAssigned"] = 2 }
            }
        ];

        string csv = ComplianceExportDriftCommand.BuildCsv(points);

        csv.Should().Contain("BucketUtc,ChangeCount,OpenFindingsCount,ResolvedFindingsCount");
        csv.Should().Contain("PackAssigned=2");
    }
}
