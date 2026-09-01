using ArchLucid.Contracts.Operations;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

internal static partial class TrialFunnelOperationalSummaryBuilder
{
    internal static TrialFunnelFirstReviewCostResponse BuildFirstReviewCost(
        IReadOnlyList<decimal> firstReviewCogsUsd,
        bool costRatesConfigured)
    {
        if (firstReviewCogsUsd.Count == 0)
        {
            return new TrialFunnelFirstReviewCostResponse
            {
                Status = "insufficient-sample",
                StatusDetail = "No first reviews were completed in the selected cohort.",
                BasisLabel = "estimated",
            };
        }

        if (!costRatesConfigured)
        {
            return new TrialFunnelFirstReviewCostResponse
            {
                SampleSize = firstReviewCogsUsd.Count,
                Status = "rates-missing",
                StatusDetail = "Usage was recorded, but an AI cost estimate could not be calculated because rate data is unavailable.",
                BasisLabel = "estimated",
            };
        }

        (decimal? low, decimal? mid, decimal? high) = ComputeCogsBands(firstReviewCogsUsd);

        return new TrialFunnelFirstReviewCostResponse
        {
            MedianEstimatedUsd = mid,
            LowEstimatedUsd = low,
            HighEstimatedUsd = high,
            SampleSize = firstReviewCogsUsd.Count,
            Status = "estimated",
            StatusDetail = "Estimated from recorded token usage and configured provider rates.",
            BasisLabel = "estimated",
        };
    }

    internal static TrialFunnelDataQualityResponse BuildDataQuality(
        int periodDays,
        bool comparePrevious,
        DateTimeOffset generatedAtUtc,
        bool instrumentationWarning = false) =>
        new()
        {
            GeneratedAtUtc = generatedAtUtc,
            PeriodDays = periodDays,
            ComparePreviousPeriod = comparePrevious,
            ExcludesDemoWorkspaces = true,
            ConversionDefinition =
                "Conversion counts trials with a TenantTrialConverted audit event or TrialStatus = Converted during the selected window.",
            InstrumentationWarning = instrumentationWarning
                ? "Some funnel events are not currently being received. Counts may be incomplete."
                : null,
            StageDefinitions =
            [
                "Trial started — TrialSignupAttempted audit event in the selected window.",
                "First review finalized — TrialFirstRunCompleted audit event (first sealed review record committed).",
                "Checkout activity — BillingCheckoutInitiated or BillingCheckoutCompleted audit events.",
                "Converted — TenantTrialConverted audit event or tenant TrialStatus = Converted.",
            ],
        };

    private static (decimal? Low, decimal? Mid, decimal? High) ComputeCogsBands(IReadOnlyList<decimal> values)
    {
        if (values.Count == 0)
            return (null, null, null);

        List<decimal> sorted = values.OrderBy(static v => v).ToList();
        decimal low = sorted[0];
        decimal high = sorted[^1];
        int midIndex = sorted.Count / 2;
        decimal mid = sorted.Count % 2 == 1 ? sorted[midIndex] : (sorted[midIndex - 1] + sorted[midIndex]) / 2m;

        return (
            decimal.Round(low, 4, MidpointRounding.AwayFromZero),
            decimal.Round(mid, 4, MidpointRounding.AwayFromZero),
            decimal.Round(high, 4, MidpointRounding.AwayFromZero));
    }
}
