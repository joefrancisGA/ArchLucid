using ArchLucid.Contracts.Operations;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

internal static partial class TrialFunnelOperationalSummaryBuilder
{
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
            CreateStage(StageFirstReviewFinalized, "First review finalized", firstCommits, signupAttempts, signupAttempts, previousPeriod?.FirstCommits, previousDenominator: signupAttempts),
            CreateStage(StageCheckoutActivity, "Checkout activity", checkouts, signupAttempts, firstCommits, previousPeriod?.Checkouts, previousDenominator: firstCommits),
            CreateStage(StageConverted, "Converted", conversions, signupAttempts, firstCommits, previousPeriod?.Conversions, previousDenominator: firstCommits),
        ];

        return stages;
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
}
