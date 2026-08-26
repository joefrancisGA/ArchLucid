using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class InsightDensityEngineDistributionCalculatorTests
{
    private static readonly InsightDensityGateOptions GateOptions = new();

    private static readonly IInsightDensityGate Gate =
        new DeterministicInsightDensityGate(Microsoft.Extensions.Options.Options.Create(GateOptions));

    [Fact]
    public void Calculate_empty_snapshot_returns_no_rows()
    {
        FindingsSnapshot snapshot = new();

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            GateOptions);

        distribution.Rows.Should().BeEmpty();
    }

    [Fact]
    public void Calculate_single_engine_reports_scores()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Enable MFA for all accounts."),
                CreateFinding("f2", "topology", "Use HTTPS for public endpoints."),
            ],
        };

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            GateOptions);

        InsightDensityEngineDistributionRow row = distribution.Rows.Single();
        row.EngineType.Should().Be("topology");
        row.FindingCount.Should().Be(2);
        row.MinScore.Should().BeLessThanOrEqualTo(row.MedianScore);
        row.MedianScore.Should().BeLessThanOrEqualTo(row.MaxScore);
    }

    [Fact]
    public void Calculate_multiple_engines_groups_by_engine_type()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Novel cross-region replication gap for `app-queue`."),
                CreateFinding("f2", "compliance", "Enable MFA for all accounts."),
                CreateFinding("f3", "compliance", "Use HTTPS for public endpoints."),
            ],
        };

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            GateOptions);

        distribution.Rows.Should().HaveCount(2);
        distribution.Rows.Select(static row => row.EngineType).Should().BeEquivalentTo(["topology", "compliance"]);
    }

    [Fact]
    public void Calculate_median_with_odd_count_uses_middle_value()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Novel `queue-worker` replication gap."),
                CreateFinding("f2", "topology", "Enable MFA for all accounts."),
                CreateFinding("f3", "topology", "Use HTTPS for public endpoints."),
            ],
        };

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            GateOptions);

        List<int> scores = snapshot.Findings
            .Select(finding =>
            {
                InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
                return Gate.Score(candidate, snapshot.Findings.Select(InsightDensityGateCandidate.FromFinding).ToList())
                    .InsightDensityScore;
            })
            .OrderBy(static score => score)
            .ToList();

        distribution.Rows.Single().MedianScore.Should().Be(scores[1]);
    }

    [Fact]
    public void Calculate_median_with_even_count_averages_middle_pair()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Novel `queue-worker` replication gap."),
                CreateFinding("f2", "topology", "Another novel `api-tier` topology gap."),
                CreateFinding("f3", "topology", "Enable MFA for all accounts."),
                CreateFinding("f4", "topology", "Use HTTPS for public endpoints."),
            ],
        };

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            GateOptions);

        List<int> scores = snapshot.Findings
            .Select(finding =>
            {
                InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
                return Gate.Score(candidate, snapshot.Findings.Select(InsightDensityGateCandidate.FromFinding).ToList())
                    .InsightDensityScore;
            })
            .OrderBy(static score => score)
            .ToList();

        int expectedMedian = (scores[1] + scores[2]) / 2;
        distribution.Rows.Single().MedianScore.Should().Be(expectedMedian);
    }

    [Fact]
    public void Calculate_would_demote_count_uses_strict_threshold_comparison()
    {
        InsightDensityGateOptions options = new() { DemotionThreshold = 50 };

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Novel `queue-worker` replication gap."),
                CreateFinding("f2", "topology", "Enable MFA for all accounts."),
            ],
        };

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            Gate,
            options);

        InsightDensityEngineDistributionRow row = distribution.Rows.Single();
        row.WouldDemoteIfUnprotectedCount.Should().Be(
            snapshot.Findings.Count(finding =>
            {
                InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
                int score = Gate.Score(candidate, snapshot.Findings.Select(InsightDensityGateCandidate.FromFinding).ToList())
                    .InsightDensityScore;

                return score < options.DemotionThreshold;
            }));
    }

    private static Finding CreateFinding(string findingId, string engineType, string message)
    {
        return new Finding
        {
            FindingId = findingId,
            EngineType = engineType,
            Category = "Security",
            Title = message,
            Rationale = message,
            FindingType = "test",
            Severity = FindingSeverity.Warning,
        };
    }
}
