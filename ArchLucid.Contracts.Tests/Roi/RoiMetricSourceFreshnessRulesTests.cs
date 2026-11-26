using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RoiMetricSourceFreshnessRulesTests
{
    private static readonly DateTime UtcNow = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(-1, "HOLD")]
    [InlineData(0, "PASS")]
    public void Offset_free_collection_timestamp_uses_utc_at_the_stale_boundary(int additionalTicks, string expected)
    {
        DateTime collected = DateTime.SpecifyKind(UtcNow.AddDays(-30).AddTicks(additionalTicks), DateTimeKind.Unspecified);
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("hours", "Hours", "4", RoiMetricSourceKind.CustomerProvided, "tenant"),
        ];

        RoiMetricSourceFreshnessRules.ResolveDisposition(collected, false, 1200m, sources, UtcNow)
            .Should().Be(expected);
    }

    [Theory]
    [InlineData(0, "PASS")]
    [InlineData(1, "HOLD")]
    public void Collection_after_the_report_clock_cannot_support_positive_savings(int ticks, string expected)
    {
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("hours", "Hours", "4", RoiMetricSourceKind.CustomerProvided, "tenant"),
        ];

        RoiMetricSourceFreshnessRules.ResolveDisposition(UtcNow.AddTicks(ticks), false, 1200m, sources, UtcNow)
            .Should().Be(expected);
    }

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
    public void Positive_savings_with_sources_but_null_extractor_timestamp_is_hold()
    {
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("hours", "Hours", "4", RoiMetricSourceKind.CustomerProvided, "tenant"),
        ];

        string disposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            extractorCollectionTimestampUtc: null,
            isDemoTenant: false,
            estimatedUsdSavings: 900m,
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

    [Theory]
    [InlineData(RoiMetricSourceKind.ExtractorZip)]
    [InlineData(RoiMetricSourceKind.RetailPriceRow)]
    public void Fresh_classified_evidence_is_not_benchmark_only(RoiMetricSourceKind sourceKind)
    {
        IReadOnlyList<RoiMetricSourceRow> sources =
        [
            new("cost", "Cost", "100", sourceKind, "evidence"),
        ];

        RoiMetricSourceFreshnessRules.ResolveDisposition(UtcNow.AddDays(-1), false, 100m, sources, UtcNow)
            .Should().Be("PASS");
    }
}
