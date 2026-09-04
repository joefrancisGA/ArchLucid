using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidGrowthFunnelMeters
{
    /// <summary>
    ///     Seconds from tenant anchor to first golden manifest commit for any tenant (labels: <c>tenant_kind</c>
    ///     = <c>trial</c> | <c>non_trial</c>).
    /// </summary>
    public static readonly Histogram<double> TenantTimeToFirstCommitSeconds =
        ArchLucidAppMeter.Instance.CreateHistogram(
            "archlucid_tenant_time_to_first_commit_seconds",
            "s",
            "Seconds from tenant anchor (TrialStartUtc or CreatedUtc) to first committed manifest (all tenants).",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    5, 15, 30, 60, 120, 300, 600, 1200, 3600, 7200, 86400
                ]
            });

    /// <summary>Trial conversions to paid or higher tier (labels: <c>from_state</c>, <c>to_tier</c>).</summary>
    public static readonly Counter<long> TrialConversionTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_trial_conversion_total",
            description: "Trial conversions (labels: from_state, to_tier).");

    /// <summary>Automated lifecycle transitions toward expiry / deletion (label <c>reason</c>).</summary>
    public static readonly Counter<long> TrialExpirationsTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_trial_expirations_total",
            description: "Trial lifecycle transitions applied by automation (label: reason).");

    /// <summary>Seconds from trial anchor (<c>TrialStartUtc</c> when set, otherwise <c>CreatedUtc</c>) to first committed manifest.</summary>
    public static readonly Histogram<double> TrialFirstRunSeconds =
        ArchLucidAppMeter.Instance.CreateHistogram(
            "archlucid_trial_first_run_seconds",
            "s",
            "Seconds from tenant trial anchor (TrialStartUtc or CreatedUtc) to first committed manifest.",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    5, 15, 30, 60, 120, 300, 600, 1200, 3600, 7200, 86400
                ]
            });

    /// <summary><c>TrialRunsUsed / TrialRunsLimit</c> at first manifest commit for metered trials (0.0–1.0+).</summary>
    public static readonly Histogram<double> TrialRunsUsedRatio =
        ArchLucidAppMeter.Instance.CreateHistogram(
            "archlucid_trial_runs_used_ratio",
            description: "TrialRunsUsed divided by TrialRunsLimit when the first manifest commits (labels none).",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1.0, 1.25, 2.0
                ]
            });

    /// <summary>
    ///     Operator UI sponsor banner showed the days-since-first-commit badge (labels: <c>tenant_id</c>,
    ///     <c>days_since_first_commit_bucket</c>).
    /// </summary>
    public static readonly Counter<long> SponsorBannerFirstCommitBadgeRenderedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid.ui.sponsor_banner.first_commit_badge_rendered",
            description:
            "Sponsor banner first-commit badge render (operator shell). Labels: tenant_id, days_since_first_commit_bucket.");

    /// <summary>Records <see cref="TrialFirstRunSeconds" /> when positive and finite.</summary>
    public static void RecordTrialFirstRunLatencySeconds(double seconds)
    {
        if (seconds <= 0 || double.IsNaN(seconds) || double.IsInfinity(seconds))
            return;

        TrialFirstRunSeconds.Record(seconds);
    }

    /// <summary>
    ///     Records <see cref="TenantTimeToFirstCommitSeconds" /> for the first successful manifest pin (any tenant).
    /// </summary>
    public static void RecordTenantTimeToFirstCommitSeconds(double seconds, string tenantKind)
    {
        if (seconds <= 0 || double.IsNaN(seconds) || double.IsInfinity(seconds))
            return;

        string k = string.IsNullOrWhiteSpace(tenantKind) ? "unknown" : tenantKind.Trim();

        if (k is not ("trial" or "non_trial"))
            k = "unknown";

        TenantTimeToFirstCommitSeconds.Record(seconds, new TagList { { "tenant_kind", k } });
    }

    /// <summary>Records <see cref="TrialRunsUsedRatio" /> clamped to non-negative values.</summary>
    public static void RecordTrialRunsUsedRatio(double ratio)
    {
        if (double.IsNaN(ratio) || double.IsInfinity(ratio))
            return;

        TrialRunsUsedRatio.Record(Math.Max(0, ratio));
    }

    /// <summary>Increments <see cref="TrialConversionTotal" />.</summary>
    public static void RecordTrialConversion(string fromState, string toTier)
    {
        TagList tags = new()
        {
            { "from_state", string.IsNullOrWhiteSpace(fromState) ? "unknown" : fromState.Trim() },
            { "to_tier", string.IsNullOrWhiteSpace(toTier) ? "unknown" : toTier.Trim() }
        };

        TrialConversionTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialExpirationsTotal" />.</summary>
    public static void RecordTrialExpiration(string reason)
    {
        string r = string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim();
        TagList tags = new() { { "reason", r } };

        TrialExpirationsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="SponsorBannerFirstCommitBadgeRenderedTotal" />.</summary>
    public static void RecordSponsorBannerFirstCommitBadgeRendered(Guid tenantId, string daysSinceFirstCommitBucket)
    {
        string bucket = string.IsNullOrWhiteSpace(daysSinceFirstCommitBucket)
            ? "unknown"
            : daysSinceFirstCommitBucket.Trim();
        TagList tags = new() { { "tenant_id", tenantId.ToString("D") }, { "days_since_first_commit_bucket", bucket } };

        SponsorBannerFirstCommitBadgeRenderedTotal.Add(1, tags);
    }
}
