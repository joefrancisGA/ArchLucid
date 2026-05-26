using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSystemicIssueTrendBuilderTests
{
    [Fact]
    public void Build_ReturnsTopSeriesWithMonthlyPoints()
    {
        DateTime monthUtc = new(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 15, 0, 0, 0, DateTimeKind.Utc);
        string monthKey = monthUtc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);

        ArchitectureFinding finding = new()
        {
            FindingId = "finding-stable-1",
            Category = "Security",
            Severity = FindingSeverity.High,
            Message = "Open port",
        };

        string runId = Guid.NewGuid().ToString("N");
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = runId },
            Results =
            [
                new AgentResult
                {
                    Findings = [finding],
                },
            ],
        };

        RunSummary summary = new()
        {
            RunId = runId,
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = monthUtc,
        };

        List<ExecutiveRoiSystemicIssueTrendSeries> trends = ExecutiveRoiSystemicIssueTrendBuilder.Build(
            [(summary, detail)]);

        trends.Should().ContainSingle();
        trends[0].FindingId.Should().Be("finding-stable-1");
        trends[0].Points.Should().Contain(static point =>
            point.MonthKey == monthKey && point.Count == 1);
    }
}
