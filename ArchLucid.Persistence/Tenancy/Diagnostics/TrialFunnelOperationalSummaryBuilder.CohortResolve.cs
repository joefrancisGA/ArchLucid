using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

internal static partial class TrialFunnelOperationalSummaryBuilder
{
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
}
