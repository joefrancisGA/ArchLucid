using System.Globalization;

using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

/// <summary>Aggregates trial funnel audit events into a founder-facing summary (Batch B item 20).</summary>
internal static class TrialFunnelOperationalSummaryBuilder
{
    internal const string StageTrialStarted = "trial-started";
    internal const string StageFirstReviewFinalized = "first-review-finalized";
    internal const string StageCheckoutActivity = "checkout-activity";
    internal const string StageConverted = "converted";

    internal static TrialFunnelOperationalSummaryResponse BuildEmpty(long activeTrials, int periodDays, bool comparePrevious) =>
        new()
        {
            ActiveSelfServiceTrials = activeTrials,
            CogsBasisLabel = "estimated",
            DataQuality = BuildDataQuality(periodDays, comparePrevious, TimeProvider.System.GetUtcNow()),
            Stages = BuildStages(0, 0, 0, 0, null),
            Timing = new TrialFunnelTimingMetricsResponse(),
            FirstReviewCost = BuildFirstReviewCost([], costRatesConfigured: false),
            CohortRows = Array.Empty<TrialFunnelCohortRowResponse>(),
        };

    internal static TrialFunnelOperationalSummaryResponse Build(
        long activeTrials,
        int periodDays,
        bool comparePrevious,
        int signupAttempts,
        int signupFailures,
        int firstCommits,
        int conversions,
        int checkouts,
        int budgetCutoffs,
        IReadOnlyList<double> signupToCommitSeconds,
        IReadOnlyList<decimal> firstReviewCogsUsd,
        bool costRatesConfigured,
        IReadOnlyList<TrialFunnelCohortRowResponse> cohortRows,
        PeriodWindowCounts? previousPeriod = null,
        IReadOnlyList<double>? trialStartToConversionSeconds = null)
    {
        double? medianSeconds = ComputeMedian(signupToCommitSeconds);
        double? medianConversionSeconds = ComputeMedian(trialStartToConversionSeconds ?? []);
        (decimal? low, decimal? mid, decimal? high) = ComputeCogsBands(firstReviewCogsUsd);
        DateTimeOffset generatedAtUtc = TimeProvider.System.GetUtcNow();

        return new TrialFunnelOperationalSummaryResponse
        {
            ActiveSelfServiceTrials = activeTrials,
            SignupAttempts30Days = signupAttempts,
            SignupFailures30Days = signupFailures,
            FirstCommittedReviews30Days = firstCommits,
            TrialConversions30Days = conversions,
            BillingCheckouts30Days = checkouts,
            MedianSignupToFirstCommitSeconds = medianSeconds,
            EstimatedFirstReviewCogsUsdLow = low,
            EstimatedFirstReviewCogsUsdMid = mid,
            EstimatedFirstReviewCogsUsdHigh = high,
            LlmBudgetCutoffEvents30Days = budgetCutoffs,
            CogsBasisLabel = mid is null ? "estimated" : "estimated",
            DataQuality = BuildDataQuality(periodDays, comparePrevious, generatedAtUtc, signupFailures > 0 && signupAttempts == 0),
            Stages = BuildStages(signupAttempts, firstCommits, checkouts, conversions, previousPeriod),
            Timing = new TrialFunnelTimingMetricsResponse
            {
                MedianTrialStartToFirstReviewFinalizedHours = medianSeconds is null ? null : Math.Round(medianSeconds.Value / 3600.0, 1),
                MedianTrialStartToFirstReviewFinalizedSampleSize = signupToCommitSeconds.Count == 0 ? null : signupToCommitSeconds.Count,
                MedianTrialStartToConversionHours = medianConversionSeconds is null ? null : Math.Round(medianConversionSeconds.Value / 3600.0, 1),
                MedianTrialStartToConversionSampleSize = trialStartToConversionSeconds is { Count: > 0 } list ? list.Count : null,
            },
            FirstReviewCost = BuildFirstReviewCost(firstReviewCogsUsd, costRatesConfigured),
            CohortRows = cohortRows,
        };
    }

    internal static bool TryReadSignupToCommitSeconds(string? dataJson, out double seconds)
    {
        seconds = 0;

        if (string.IsNullOrWhiteSpace(dataJson))
            return false;

        try
        {
            using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(dataJson);
            System.Text.Json.JsonElement root = doc.RootElement;

            if (root.TryGetProperty("signupToCommitSeconds", out System.Text.Json.JsonElement prop)
                && prop.ValueKind == System.Text.Json.JsonValueKind.Number
                && prop.TryGetDouble(out double value)
                && value > 0
                && double.IsFinite(value))
            {
                seconds = value;
                return true;
            }
        }
        catch (System.Text.Json.JsonException)
        {
            return false;
        }

        return false;
    }

    internal static IReadOnlyList<TrialFunnelStageMetricResponse> BuildStages(
        int signupAttempts,
        int firstCommits,
        int checkouts,
        int conversions,
        PeriodWindowCounts? previousPeriod)
    {
        TrialFunnelStageMetricResponse[] stages =
        [
            CreateStage(StageTrialStarted, "Trial started", signupAttempts, signupAttempts, null, previousPeriod?.SignupAttempts),
            CreateStage(StageFirstReviewFinalized, "First review finalized", firstCommits, signupAttempts, firstCommits, previousPeriod?.FirstCommits, previousDenominator: signupAttempts),
            CreateStage(StageCheckoutActivity, "Checkout activity", checkouts, signupAttempts, checkouts, previousPeriod?.Checkouts, previousDenominator: firstCommits),
            CreateStage(StageConverted, "Converted", conversions, signupAttempts, conversions, previousPeriod?.Conversions, previousDenominator: firstCommits),
        ];

        return stages;
    }

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

    internal static string ResolveCohortStageLabel(TenantCohortSourceRow row)
    {
        if (string.Equals(row.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
            return "Converted";

        if (row.TrialFirstManifestCommittedUtc is not null)
            return "First review finalized";

        if (row.TrialRunsUsed > 0)
            return "Review activity";

        return "Trial started";
    }

    internal static string ResolveCohortStageId(TenantCohortSourceRow row)
    {
        if (string.Equals(row.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
            return StageConverted;

        if (row.TrialFirstManifestCommittedUtc is not null)
            return StageFirstReviewFinalized;

        if (row.TrialRunsUsed > 0)
            return "review-activity";

        return StageTrialStarted;
    }

    internal static string? ResolveAttentionLabel(TenantCohortSourceRow row, DateTimeOffset utcNow)
    {
        if (string.Equals(row.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
            return null;

        if (row.TrialRunsUsed > 0 && row.TrialFirstManifestCommittedUtc is null)
            return "Review started but not finalized";

        if (row.LastActivityUtc is null || row.LastActivityUtc < utcNow.AddDays(-7))
            return "Inactive for 7 days";

        if (row.TrialExpiresUtc is not null && row.TrialExpiresUtc <= utcNow.AddDays(7))
            return "Nearing trial expiration";

        if (row.EstimatedFirstReviewCostUsd is >= 30m)
            return "High first-review AI cost";

        return null;
    }

    private static TrialFunnelStageMetricResponse CreateStage(
        string stageId,
        string label,
        int count,
        int trialStartDenominator,
        int? previousStageCount,
        int? previousPeriodCount,
        int? previousDenominator = null)
    {
        double? percentOfTrials = trialStartDenominator > 0
            ? Math.Round(count * 100.0 / trialStartDenominator, 0)
            : null;

        int priorDenominator = previousDenominator ?? trialStartDenominator;
        double? percentFromPrevious = previousStageCount is > 0
            ? Math.Round(count * 100.0 / previousStageCount.Value, 0)
            : null;

        return new TrialFunnelStageMetricResponse
        {
            StageId = stageId,
            Label = label,
            Count = count,
            PercentOfTrialStarts = percentOfTrials,
            PercentFromPreviousStage = percentFromPrevious,
            PreviousPeriodCount = previousPeriodCount,
        };
    }

    private static double? ComputeMedian(IReadOnlyList<double> values)
    {
        if (values.Count == 0)
            return null;

        List<double> sorted = values.OrderBy(static v => v).ToList();
        int mid = sorted.Count / 2;

        if (sorted.Count % 2 == 1)
            return Math.Round(sorted[mid], 1);

        return Math.Round((sorted[mid - 1] + sorted[mid]) / 2.0, 1);
    }

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

    internal sealed class PeriodWindowCounts
    {
        public int SignupAttempts
        {
            get;
            init;
        }

        public int FirstCommits
        {
            get;
            init;
        }

        public int Checkouts
        {
            get;
            init;
        }

        public int Conversions
        {
            get;
            init;
        }
    }

    internal sealed class TenantCohortSourceRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string OrganizationName
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset? TrialStartedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public string? TrialStatus
        {
            get;
            init;
        }

        public DateTimeOffset? TrialFirstManifestCommittedUtc
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }

        public DateTimeOffset? LastActivityUtc
        {
            get;
            init;
        }

        public decimal? EstimatedFirstReviewCostUsd
        {
            get;
            init;
        }
    }
}
