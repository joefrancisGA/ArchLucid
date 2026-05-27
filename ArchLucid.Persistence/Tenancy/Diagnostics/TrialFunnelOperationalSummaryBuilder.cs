using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

/// <summary>Aggregates trial funnel audit events into a founder-facing summary (Batch B item 20).</summary>
internal static class TrialFunnelOperationalSummaryBuilder
{
    internal static TrialFunnelOperationalSummaryResponse BuildEmpty(long activeTrials) =>
        new()
        {
            ActiveSelfServiceTrials = activeTrials,
            CogsBasisLabel = "estimated",
        };

    internal static TrialFunnelOperationalSummaryResponse Build(
        long activeTrials,
        int signupAttempts,
        int signupFailures,
        int firstCommits,
        int conversions,
        int checkouts,
        int budgetCutoffs,
        IReadOnlyList<double> signupToCommitSeconds,
        IReadOnlyList<decimal> firstReviewCogsUsd)
    {
        double? medianSeconds = ComputeMedian(signupToCommitSeconds);
        (decimal? low, decimal? mid, decimal? high) = ComputeCogsBands(firstReviewCogsUsd);

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
            CogsBasisLabel = "estimated",
        };
    }

    internal static bool TryReadSignupToCommitSeconds(string? dataJson, out double seconds)
    {
        seconds = 0;

        if (string.IsNullOrWhiteSpace(dataJson))
            return false;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(dataJson);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("signupToCommitSeconds", out JsonElement prop)
                && prop.ValueKind == JsonValueKind.Number
                && prop.TryGetDouble(out double value)
                && value > 0
                && double.IsFinite(value))
            {
                seconds = value;
                return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
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
}
