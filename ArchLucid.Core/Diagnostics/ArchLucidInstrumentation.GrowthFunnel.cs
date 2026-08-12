using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Self-service growth funnel telemetry: trial signup, email OTP, abuse denials, activation latency, conversion,
///     expiry, and upgrade/expansion nudges.
/// </summary>
/// <remarks>
///     Label values are normalized to closed sets here rather than at the call site so a new caller cannot silently
///     explode metric cardinality (every unrecognized value collapses to <c>unknown</c>).
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    private static Func<string, bool>? _firstTenantFunnelEventNameValidator;

    private static int _trialFunnelObservableGaugesRegistered;

    private static long _trialActiveTenantsCached;

    private static readonly HashSet<string> TrialUpgradeNudgeTriggers =
        new(StringComparer.Ordinal) { "runs", "seats", "expiry" };

    private static readonly HashSet<string> TeamExpansionNudgeTriggers =
        new(StringComparer.Ordinal) { "seats", "workspaces" };

    private static readonly string[] CorePilotRailChecklistSteps =
        ["create_request", "track_review", "finalize_review_package", "review_outputs"];

    public static void SetFirstTenantFunnelEventNameValidator(Func<string, bool> validator) =>
        Volatile.Write(ref _firstTenantFunnelEventNameValidator, validator);

    /// <summary>Registers trial funnel observable gauges once (call from OpenTelemetry host setup).</summary>
    public static void EnsureTrialFunnelObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _trialFunnelObservableGaugesRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_trial_active_tenants",
            () => new Measurement<long>(Volatile.Read(ref _trialActiveTenantsCached)),
            description:
            "Tenants currently on an active self-service trial (TrialStatus=Active, TrialExpiresUtc set).");
    }

    /// <summary>Updates the cached value read by <c>archlucid_trial_active_tenants</c> (background metrics collector).</summary>
    public static void PublishTrialActiveTenantCount(long count)
    {
        if (count < 0)

            count = 0;

        Volatile.Write(ref _trialActiveTenantsCached, count);
    }

    /// <summary>Increments <see cref="TrialSignupsTotal" />.</summary>
    public static void RecordTrialSignup(string source, string mode)
    {
        TagList tags = new()
        {
            { "source", string.IsNullOrWhiteSpace(source) ? "unknown" : source.Trim() },
            { "mode", string.IsNullOrWhiteSpace(mode) ? "unknown" : mode.Trim() }
        };

        TrialSignupsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="SignupMarketingConversionTotal" /> with coarse attribution buckets (TB-019).</summary>
    public static void RecordSignupMarketingConversion(string coarseMedium, string coarsePlatform)
    {
        TagList tags = new()
        {
            { "attribution.medium", string.IsNullOrWhiteSpace(coarseMedium) ? "unknown" : coarseMedium.Trim() },
            { "attribution.platform", string.IsNullOrWhiteSpace(coarsePlatform) ? "unknown" : coarsePlatform.Trim() },
        };

        SignupMarketingConversionTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialSignupFailuresTotal" />.</summary>
    public static void RecordTrialSignupFailure(string stage, string reason)
    {
        TagList tags = new()
        {
            { "stage", string.IsNullOrWhiteSpace(stage) ? "unknown" : stage.Trim() },
            { "reason", string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim() }
        };

        TrialSignupFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialFunnelHealthProbeTotal" /> (label: <c>outcome</c> success|failure).</summary>
    public static void RecordTrialFunnelHealthProbe(string outcome)
    {
        string o = string.IsNullOrWhiteSpace(outcome) ? "unknown" : outcome.Trim();
        if (o is not ("success" or "failure"))
            o = "unknown";
        TagList tags = new() { { "outcome", o } };
        TrialFunnelHealthProbeTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialRegistrationFailuresTotal" /> (label: <c>reason</c> validation|conflict|internal).</summary>
    public static void RecordTrialRegistrationFailure(string reason)
    {
        string r = string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim();
        if (r is not ("validation" or "conflict" or "internal"))
            r = "unknown";
        TagList tags = new() { { "reason", r } };
        TrialRegistrationFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="EmailOtpChallengeRequestedTotal" />.</summary>
    public static void RecordEmailOtpChallengeRequested(string result)
    {
        TagList tags = new() { { "result", NormalizeEmailOtpChallengeResult(result) } };

        EmailOtpChallengeRequestedTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="EmailOtpChallengeVerifiedTotal" />.</summary>
    public static void RecordEmailOtpChallengeVerified(string result)
    {
        TagList tags = new() { { "result", NormalizeEmailOtpVerifyResult(result) } };

        EmailOtpChallengeVerifiedTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="EmailOtpDeliveryFailedTotal" />.</summary>
    public static void RecordEmailOtpDeliveryFailed()
    {
        EmailOtpDeliveryFailedTotal.Add(1);
    }

    /// <summary>Increments <see cref="EmailOtpRateLimitTriggeredTotal" />.</summary>
    public static void RecordEmailOtpRateLimitTriggered(string scope)
    {
        TagList tags = new() { { "scope", string.IsNullOrWhiteSpace(scope) ? "unknown" : scope.Trim() } };

        EmailOtpRateLimitTriggeredTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="SelfServiceTrialAbuseDeniedTotal" />.</summary>
    public static void RecordSelfServiceTrialAbuseDenied(string reason)
    {
        TagList tags = new() { { "reason", string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim() } };

        SelfServiceTrialAbuseDeniedTotal.Add(1, tags);
    }

    private static string NormalizeEmailOtpChallengeResult(string result)
    {
        string r = string.IsNullOrWhiteSpace(result) ? "unknown" : result.Trim();

        return r switch
        {
            "accepted" or "rate_limited" or "sso_required" or "disabled" or "invalid_email" or "bot_challenge_failed" => r,
            _ => "unknown"
        };
    }

    private static string NormalizeEmailOtpVerifyResult(string result)
    {
        string r = string.IsNullOrWhiteSpace(result) ? "unknown" : result.Trim();

        return r switch
        {
            "success" or "invalid" or "expired" or "rate_limited" or "sso_required" => r,
            _ => "invalid"
        };
    }

    /// <summary>Increments <see cref="TrialSignupBaselineSkippedTotal" /> (model-default baseline path at signup).</summary>
    public static void RecordTrialSignupBaselineSkipped()
    {
        TrialSignupBaselineSkippedTotal.Add(1);
    }

    /// <summary>Increments <see cref="BaselineManualPrepCapturedTotal" />.</summary>
    public static void RecordBaselineManualPrepCaptured()
    {
        BaselineManualPrepCapturedTotal.Add(1);
    }

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

    /// <summary>Increments <see cref="TrialUpgradeNudgeShownTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeShown(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TrialUpgradeNudgeClickedTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeClicked(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTrialUpgradeNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? "unknown" : trigger.Trim();

        return TrialUpgradeNudgeTriggers.Contains(t) ? t : "unknown";
    }

    /// <summary>Increments <see cref="TeamExpansionNudgeShownTotal" />.</summary>
    public static void RecordTeamExpansionNudgeShown(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TeamExpansionNudgeClickedTotal" />.</summary>
    public static void RecordTeamExpansionNudgeClicked(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTeamExpansionNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? "unknown" : trigger.Trim();

        return TeamExpansionNudgeTriggers.Contains(t) ? t : "unknown";
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

    /// <summary>Increments <see cref="CorePilotRailChecklistStepsTotal" /> for checklist step indices 0–3 inclusive.</summary>
    public static void RecordCorePilotRailChecklistStep(int stepIndex)
    {
        if (stepIndex < 0 || stepIndex >= CorePilotRailChecklistSteps.Length)
            throw new ArgumentOutOfRangeException(
                nameof(stepIndex),
                stepIndex,
                $"stepIndex must be 0..{CorePilotRailChecklistSteps.Length - 1}");

        TagList tags = new() { { "step", CorePilotRailChecklistSteps[stepIndex] } };

        CorePilotRailChecklistStepsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="FirstSessionCompletedTotal" /> once per tenant (caller must gate).</summary>
    public static void RecordFirstSessionCompleted()
    {
        FirstSessionCompletedTotal.Add(1);
    }

    /// <summary>Records <see cref="WizardToCommittedMinutes" /> for wizard-sourced runs (TB-220).</summary>
    public static void RecordWizardToCommittedMinutes(double minutes, string executionMode, string presetUsed)
    {
        double clampedMinutes = minutes < 0 ? 0 : minutes;
        string mode = string.IsNullOrWhiteSpace(executionMode) ? "unknown" : executionMode.Trim().ToLowerInvariant();
        string preset = string.IsNullOrWhiteSpace(presetUsed) ? "unknown" : presetUsed.Trim().ToLowerInvariant();
        TagList tags = new()
        {
            { "execution_mode", mode },
            { "preset_used", preset },
        };

        WizardToCommittedMinutes.Record(clampedMinutes, tags);
    }

    /// <summary>Records one pricing quote request age observation for SLA histogram export.</summary>
    public static void RecordPricingQuoteRequestAgeHours(double ageHours, string breachStatus)
    {
        if (ageHours < 0)
            ageHours = 0;

        if (string.IsNullOrWhiteSpace(breachStatus))
            breachStatus = "unknown";

        KeyValuePair<string, object?>[] tags =
        [
            new KeyValuePair<string, object?>("breach_status", breachStatus)
        ];

        PricingQuoteRequestAgeHours.Record(ageHours, tags.AsSpan());
    }

    /// <summary>
    ///     Increments <see cref="FirstTenantFunnelEventsTotal" />. <paramref name="eventName" /> must be one of
    ///     <see cref="FirstTenantFunnelEventNames" />. <paramref name="tenantIdNormalized" /> is added as a
    ///     <c>tenant_id</c> tag <b>only</b> when <paramref name="recordPerTenant" /> is true (owner-only flag
    ///     per pending question 40). Never tags <c>userId</c>, IP, or any other personal data.
    /// </summary>
    public static void RecordFirstTenantFunnelEvent(
        string eventName,
        bool recordPerTenant,
        string? tenantIdNormalized)
    {
        if (_firstTenantFunnelEventNameValidator != null && !_firstTenantFunnelEventNameValidator(eventName))
            throw new ArgumentOutOfRangeException(
                nameof(eventName),
                eventName,
                "eventName must be one of the known FirstTenantFunnelEventNames constants.");

        TagList tags = new() { { "event", eventName } };

        if (recordPerTenant && !string.IsNullOrEmpty(tenantIdNormalized))

            tags.Add("tenant_id", tenantIdNormalized);

        FirstTenantFunnelEventsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="OperatorTaskSuccessTotal" /> for a low-cardinality <paramref name="task" /> label.</summary>
    public static void RecordOperatorTaskSuccess(string task)
    {
        string t = string.IsNullOrWhiteSpace(task) ? "unknown" : task.Trim();
        if (t is not ("first_run_committed" or "first_session_completed"))
            throw new ArgumentOutOfRangeException(nameof(task),
                "task must be first_run_committed or first_session_completed.");

        TagList tags = new() { { "task", t } };

        OperatorTaskSuccessTotal.Add(1, tags);
    }
}
