using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using Microsoft.Extensions.Time.Testing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSystemicIssueTrendBuilderTests
{
    [Fact]
    public void Build_ReturnsTopSeriesWithMonthlyPoints()
    {
        DateTime monthUtc = new(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        FakeTimeProvider timeProvider = new(new DateTimeOffset(monthUtc, TimeSpan.Zero));
        string monthKey = monthUtc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);

        ArchitectureFinding finding = new()
        {
            FindingId = "finding-stable-1",
            Category = "Security",
            Severity = FindingSeverity.Critical,
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
            [(summary, detail)],
            timeProvider);

        trends.Should().ContainSingle();
        trends[0].FindingId.Should().Be("finding-stable-1");
        trends[0].Points.Should().Contain(point =>
            point.MonthKey == monthKey && point.Count == 1);
    }
}
