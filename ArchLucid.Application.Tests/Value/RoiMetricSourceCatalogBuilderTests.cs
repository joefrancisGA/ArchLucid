using System.Text;

using ArchLucid.Application.Value;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Value;

[Trait("Suite", "Core")]
public sealed class RoiMetricSourceCatalogBuilderTests
{
    [Fact]
    public void Build_without_tenant_baselines_marks_hours_and_dollars_as_benchmark_assumptions()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: null,
            reviewProvenance: ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
            tenantManualPrepHours: null);

        IReadOnlyList<RoiMetricSourceRow> rows = RoiMetricSourceCatalogBuilder.Build(snapshot);

        RoiMetricSourceRow hours = rows.Single(r => r.MetricKey == "estimated-architect-hours-saved-total");
        hours.SourceKind.Should().Be(RoiMetricSourceKind.BenchmarkAssumption);

        RoiMetricSourceRow llm = rows.Single(r => r.MetricKey == "annualized-llm-cost-usd");
        llm.SourceKind.Should().Be(RoiMetricSourceKind.BenchmarkAssumption);
        llm.CitationDetail.Should().Contain("not invoiced");
    }

    [Fact]
    public void Build_with_tenant_baselines_marks_hours_as_customer_provided()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: 40m,
            reviewProvenance: ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantManualPrepHours: 12m);

        IReadOnlyList<RoiMetricSourceRow> rows = RoiMetricSourceCatalogBuilder.Build(snapshot);

        rows.Single(r => r.MetricKey == "estimated-architect-hours-saved-total")
            .SourceKind.Should().Be(RoiMetricSourceKind.CustomerProvided);

        rows.Single(r => r.MetricKey == "tenant-baseline-review-cycle-hours")
            .SourceKind.Should().Be(RoiMetricSourceKind.CustomerProvided);
    }

    [Fact]
    public void AppendMarkdownSection_labels_unsupported_claims_explicitly()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: null,
            reviewProvenance: ReviewCycleBaselineProvenance.NoMeasurementYet,
            tenantManualPrepHours: null);

        IReadOnlyList<RoiMetricSourceRow> rows = RoiMetricSourceCatalogBuilder.Build(snapshot);
        StringBuilder sb = new();
        RoiMetricSourceMarkdownFormatter.AppendMarkdownSection(sb, rows);

        string md = sb.ToString();
        md.Should().Contain("BenchmarkAssumption");
        md.Should().Contain("NotEstimated");
        md.Should().Contain("not realized customer outcomes");
    }

    private static ValueReportSnapshot CreateSnapshot(
        decimal? tenantBaselineReviewCycleHours,
        ReviewCycleBaselineProvenance reviewProvenance,
        decimal? tenantManualPrepHours) =>
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            3,
            2,
            1,
            0,
            10m,
            2m,
            1m,
            13m,
            4.5m,
            "Per-run estimate from ValueReportComputationOptions — not invoice truth.",
            12000m,
            900m,
            25000m,
            -13900m,
            -55.6m,
            tenantBaselineReviewCycleHours,
            tenantBaselineReviewCycleHours is null ? null : "signup",
            tenantBaselineReviewCycleHours is null ? null : DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
            null,
            0,
            reviewProvenance,
            null,
            null,
            0,
            0,
            tenantManualPrepHours,
            null);
}
