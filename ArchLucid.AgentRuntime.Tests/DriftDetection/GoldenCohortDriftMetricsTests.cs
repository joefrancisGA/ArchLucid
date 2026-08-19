using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

[Trait("Suite", "Core")]
public sealed class GoldenCohortDriftMetricsTests
{
    [Fact]
    public void Jaccard_empty_both_yields_one()
    {
        GoldenCohortDriftMetrics.Jaccard([], []).Should().Be(1d);
    }

    [Fact]
    public void Jaccard_disjoint_yields_zero()
    {
        GoldenCohortDriftMetrics.Jaccard(["a"], ["b"]).Should().Be(0d);
    }

    [Fact]
    public void SeverityTotalVariation_identical_histograms_yield_zero()
    {
        GoldenCohortDriftFindingSummary sim = new()
        {
            FindingCount = 4,
            SeverityCounts = new Dictionary<string, int>(StringComparer.Ordinal) { ["Warning"] = 2, ["Info"] = 2 },
        };

        GoldenCohortDriftFindingSummary real = new()
        {
            FindingCount = 4,
            SeverityCounts = new Dictionary<string, int>(StringComparer.Ordinal) { ["Warning"] = 2, ["Info"] = 2 },
        };

        GoldenCohortDriftMetrics.SeverityTotalVariation(sim, real).Should().Be(0d);
    }
}
