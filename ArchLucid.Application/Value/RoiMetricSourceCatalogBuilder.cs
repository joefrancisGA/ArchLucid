using System.Globalization;

using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Value;

/// <summary>
///     Maps <see cref="ValueReportSnapshot" /> headline metrics to explicit ROI source classifications.
/// </summary>
public static class RoiMetricSourceCatalogBuilder
{
    public static IReadOnlyList<RoiMetricSourceRow> Build(ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        RoiMetricSourceKind hoursSource = ResolveHoursSavedSource(snapshot);
        RoiMetricSourceKind reviewBaselineSource = ResolveReviewBaselineSource(snapshot);

        List<RoiMetricSourceRow> rows =
        [
            Row(
                "estimated-architect-hours-saved-total",
                "Estimated architect hours saved (total)",
                snapshot.EstimatedTotalArchitectHoursSaved.ToString(CultureInfo.InvariantCulture),
                hoursSource,
                HoursSavedCitation(snapshot, hoursSource)),
            Row(
                "annualized-hours-value-usd",
                "Annualized hours value (USD)",
                snapshot.AnnualizedHoursValueUsd.ToString(CultureInfo.InvariantCulture),
                hoursSource,
                "Derived from estimated hours saved × fully loaded hourly rate from ROI model options."),
            Row(
                "estimated-llm-cost-window-usd",
                "Estimated LLM cost for window (USD)",
                snapshot.EstimatedLlmCostForWindowUsd.ToString(CultureInfo.InvariantCulture),
                RoiMetricSourceKind.BenchmarkAssumption,
                snapshot.EstimatedLlmCostMethodologyNote),
            Row(
                "annualized-llm-cost-usd",
                "Annualized LLM cost (USD)",
                snapshot.AnnualizedLlmCostUsd.ToString(CultureInfo.InvariantCulture),
                RoiMetricSourceKind.BenchmarkAssumption,
                "Annualized from per-run LLM estimate — not invoiced Azure OpenAI usage."),
            Row(
                "baseline-annual-subscription-ops-usd",
                "Baseline annual subscription + ops (USD, ROI model)",
                snapshot.BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel.ToString(CultureInfo.InvariantCulture),
                RoiMetricSourceKind.BenchmarkAssumption,
                "Repository ROI model default — see docs/library/PILOT_ROI_MODEL.md."),
            Row(
                "net-annualized-vs-baseline-usd",
                "Net annualized vs baseline (USD)",
                snapshot.NetAnnualizedValueVersusRoiBaselineUsd.ToString(CultureInfo.InvariantCulture),
                RoiMetricSourceKind.BenchmarkAssumption,
                "Composite of hours-value, LLM cost, and ROI-model baseline assumptions."),
            Row(
                "roi-annualized-percent",
                "ROI vs baseline (%)",
                snapshot.RoiAnnualizedPercentVersusRoiBaseline.ToString(CultureInfo.InvariantCulture),
                RoiMetricSourceKind.BenchmarkAssumption,
                "Computed from composite assumptions above — not a customer attestation."),
            Row(
                "tenant-baseline-review-cycle-hours",
                "Tenant baseline review cycle (hours)",
                FormatOptionalDecimal(snapshot.TenantBaselineReviewCycleHours),
                reviewBaselineSource,
                ReviewBaselineCitation(snapshot, reviewBaselineSource)),
            Row(
                "measured-average-review-cycle-hours",
                "Measured average review cycle (hours, window)",
                FormatOptionalDecimal(snapshot.MeasuredAverageReviewCycleHoursForWindow),
                snapshot.MeasuredAverageReviewCycleHoursForWindow is null
                    ? RoiMetricSourceKind.NotEstimated
                    : RoiMetricSourceKind.CustomerProvided,
                snapshot.MeasuredAverageReviewCycleHoursForWindow is null
                    ? "No committed-run timing sample in the selected window."
                    : $"Sample size {snapshot.MeasuredReviewCycleSampleSize.ToString(CultureInfo.InvariantCulture)} run(s) in tenant window."),
        ];

        return rows;
    }

    private static RoiMetricSourceKind ResolveHoursSavedSource(ValueReportSnapshot snapshot)
    {
        if (snapshot.TenantBaselineManualPrepHoursPerReview is not null
            || snapshot.TenantBaselinePeoplePerReview is not null)
        {
            return RoiMetricSourceKind.CustomerProvided;
        }

        if (snapshot.ReviewCycleBaselineProvenance is ReviewCycleBaselineProvenance.TenantSuppliedAtSignup
            or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings)
        {
            return RoiMetricSourceKind.CustomerProvided;
        }

        return RoiMetricSourceKind.BenchmarkAssumption;
    }

    private static RoiMetricSourceKind ResolveReviewBaselineSource(ValueReportSnapshot snapshot)
    {
        return snapshot.ReviewCycleBaselineProvenance switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup
                or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings => RoiMetricSourceKind.CustomerProvided,
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions => RoiMetricSourceKind.BenchmarkAssumption,
            ReviewCycleBaselineProvenance.NoMeasurementYet => RoiMetricSourceKind.NotEstimated,
            _ => RoiMetricSourceKind.BenchmarkAssumption,
        };
    }

    private static string HoursSavedCitation(ValueReportSnapshot snapshot, RoiMetricSourceKind source)
    {
        if (source is RoiMetricSourceKind.CustomerProvided)
        {
            return "Uses tenant-captured baseline prep or review-cycle inputs where present.";
        }

        return "Uses ROI model default hours-per-manifest/governance/drift heuristics — illustrative until buyer baselines are captured.";
    }

    private static string ReviewBaselineCitation(ValueReportSnapshot snapshot, RoiMetricSourceKind source)
    {
        if (source is RoiMetricSourceKind.CustomerProvided)
        {
            string? label = snapshot.TenantBaselineReviewCycleSource;

            return string.IsNullOrWhiteSpace(label)
                ? "Tenant baseline review-cycle hours captured at signup or via operator settings."
                : $"Tenant baseline source marker: {label}.";
        }

        if (source is RoiMetricSourceKind.NotEstimated)
            return "No review-cycle measurement in the selected window.";

        return "Defaulted from ValueReportComputationOptions when tenant baseline is absent.";
    }

    private static string FormatOptionalDecimal(decimal? value) =>
        value is null ? "(not estimated)" : value.Value.ToString(CultureInfo.InvariantCulture);

    private static RoiMetricSourceRow Row(
        string key,
        string label,
        string value,
        RoiMetricSourceKind kind,
        string citation) =>
        new(key, label, value, kind, citation);
}
