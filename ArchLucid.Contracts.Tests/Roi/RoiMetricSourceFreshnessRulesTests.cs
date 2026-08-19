using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RoiMetricSourceFreshnessRulesTests
{
    private static readonly DateTime UtcNow = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Unsourced_positive_savings_is_hold()
    {
        string disposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            extractorCollectionTimestampUtc: UtcNow.AddDays(-1),
            isDemoTenant: false,
            estimatedUsdSavings: 5000m,
            sources: [],
            utcNow: UtcNow);

        disposition.Should().Be("HOLD");
    }

    [Fact]
    public void Stale_extractor_with_positive_savings_is_hold()
    {
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("hours", "Hours", "4", RoiMetricSourceKind.CustomerProvided, "tenant"),
        ];

        string disposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            extractorCollectionTimestampUtc: UtcNow.AddDays(-45),
            isDemoTenant: false,
            estimatedUsdSavings: 1200m,
            sources: sources,
            utcNow: UtcNow);

        disposition.Should().Be("HOLD");
    }

    [Fact]
    public void Benchmark_only_savings_is_warn()
    {
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("net", "Net", "100", RoiMetricSourceKind.BenchmarkAssumption, "model"),
        ];

        string disposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            extractorCollectionTimestampUtc: UtcNow.AddDays(-1),
            isDemoTenant: false,
            estimatedUsdSavings: 100m,
            sources: sources,
            utcNow: UtcNow);

        disposition.Should().Be("WARN");
    }
}
