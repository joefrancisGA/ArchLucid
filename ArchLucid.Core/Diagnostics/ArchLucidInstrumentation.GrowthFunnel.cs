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
    // Instrument catalog

    
    /// <summary>Manual prep / people-per-review baseline persisted (settings UI gate).</summary>
    public static readonly Counter<long> BaselineManualPrepCapturedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_baseline_manual_prep_captured_total",
            description: "Tenant manual baseline fields saved (PUT /v1/tenant/baseline).");

    
    /// <summary>
    ///     Guided Core Pilot checklist progress from the operator shell (labels:
    ///     <c>step</c> = canonical slug; four steps only — low cardinality).
    /// </summary>
    public static readonly Counter<long> CorePilotRailChecklistStepsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_core_pilot_rail_checklist_step_total",
            description:
            "Operator-shell Core Pilot checklist step acknowledgements POST /v1/diagnostics/core-pilot-rail-step (label step slug).");

    
    /// <summary>Email OTP challenge requests (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeRequestedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_challenge_requested_total",
            description: "Email OTP challenge requests (label result=accepted|rate_limited|sso_required|disabled|invalid_email|bot_challenge_failed).");

    
    /// <summary>Email OTP verify attempts (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeVerifiedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_challenge_verified_total",
            description: "Email OTP verify attempts (label result=success|invalid|expired|rate_limited|sso_required).");

    
    /// <summary>Email OTP outbound delivery failures.</summary>
    public static readonly Counter<long> EmailOtpDeliveryFailedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_delivery_failed_total",
            description: "Email OTP sign-in code delivery failures.");

    
    /// <summary>Email OTP rate-limit triggers (labels: <c>scope</c>=email|ip|email_verification_hourly).</summary>
    public static readonly Counter<long> EmailOtpRateLimitTriggeredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_rate_limit_triggered_total",
            description: "Email OTP rate-limit triggers (label scope).");

    
    /// <summary>First successful golden-manifest commit per tenant (Core Pilot onboarding funnel).</summary>
    public static readonly Counter<long> FirstSessionCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_first_session_completed_total",
            description: "Increments once per tenant on first successful manifest commit.");

    
    /// <summary>
    ///     First-tenant onboarding funnel events (Improvement 12). Aggregated counter — the
    ///     <c>event</c> tag is the only label by default. The <c>tenant_id</c> tag is added only when the
    ///     <c>Telemetry:FirstTenantFunnel:PerTenantEmission</c> feature flag is on (owner-only flip per
    ///     pending question 40 / <c>docs/security/PRIVACY_NOTE.md</c> §3.A).
    /// </summary>
    public static readonly Counter<long> FirstTenantFunnelEventsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_first_tenant_funnel_events_total",
            description:
            "First-tenant onboarding funnel events (label: event includes signup|tour_opt_in|first_run_started|first_run_committed|first_finding_viewed|first_finalization_attempted|first_export_opened|thirty_minute_milestone). tenant_id label added ONLY when Telemetry:FirstTenantFunnel:PerTenantEmission is true.");

    
    /// <summary>
    ///     Operator onboarding funnel successes (labels: <c>task</c> = <c>first_run_committed</c> |
    ///     <c>first_session_completed</c>).
    /// </summary>
    public static readonly Counter<long> OperatorTaskSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_operator_task_success_total",
            description:
            "Server-side verified onboarding milestones (label task=first_run_committed|first_session_completed).");

    
    /// <summary>
    ///     Age in hours of unanswered marketing pricing quote requests (labels: <c>breach_status</c>).
    ///     Populated every five minutes by <c>MarketingPricingQuoteAgingMetricsHostedService</c>.
    /// </summary>
    public static readonly Histogram<double> PricingQuoteRequestAgeHours =
        AppMeter.CreateHistogram(
            "archlucid_pricing_quote_request_age_hours",
            "hours",
            "Age in hours of unanswered marketing pricing quote requests.",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    1, 6, 12, 18, 24, 48, 72, 168
                ]
            });

    
    /// <summary>Self-service trial abuse denials (labels: <c>reason</c>).</summary>
    public static readonly Counter<long> SelfServiceTrialAbuseDeniedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_self_service_trial_abuse_denied_total",
            description: "Self-service trial/workspace abuse policy denials (label reason).");

    
    /// <summary>Signup marketing attribution conversions (labels: <c>attribution.medium</c>, <c>attribution.platform</c>).</summary>
    public static readonly Counter<long> SignupMarketingConversionTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_signup_marketing_conversion_total",
            description: "First-touch signup attribution persisted after successful trial provision (coarse buckets only).");

    
    /// <summary>
    ///     Operator UI sponsor banner showed the days-since-first-commit badge (labels: <c>tenant_id</c>,
    ///     <c>days_since_first_commit_bucket</c>).
    /// </summary>
    public static readonly Counter<long> SponsorBannerFirstCommitBadgeRenderedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.ui.sponsor_banner.first_commit_badge_rendered",
            description:
            "Sponsor banner first-commit badge render (operator shell). Labels: tenant_id, days_since_first_commit_bucket.");

    
    /// <summary>Paid Team expansion nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeClickedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_team_expansion_nudge_clicked_total",
            description: "Team expansion nudge CTA clicks (label: trigger=seats|workspaces).");

    
    /// <summary>Paid Team expansion nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeShownTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_team_expansion_nudge_shown_total",
            description: "Team expansion nudge shown in operator shell (label: trigger=seats|workspaces).");

    
    /// <summary>
    ///     Seconds from tenant anchor to first golden manifest commit for any tenant (labels: <c>tenant_kind</c>
    ///     = <c>trial</c> | <c>non_trial</c>).
    /// </summary>
    public static readonly Histogram<double> TenantTimeToFirstCommitSeconds =
        AppMeter.CreateHistogram(
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
        AppMeter.CreateCounter<long>(
            "archlucid_trial_conversion_total",
            description: "Trial conversions (labels: from_state, to_tier).");

    
    /// <summary>Automated lifecycle transitions toward expiry / deletion (label <c>reason</c>).</summary>
    public static readonly Counter<long> TrialExpirationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_expirations_total",
            description: "Trial lifecycle transitions applied by automation (label: reason).");

    
    /// <summary>Seconds from trial anchor (<c>TrialStartUtc</c> when set, otherwise <c>CreatedUtc</c>) to first committed manifest.</summary>
    public static readonly Histogram<double> TrialFirstRunSeconds =
        AppMeter.CreateHistogram(
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

    
    /// <summary>Background health check of <c>GET /v1/demo/preview</c> (labels: <c>outcome</c>=success|failure).</summary>
    public static readonly Counter<long> TrialFunnelHealthProbeTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_funnel_health_probe_total",
            description: "Trial funnel demo preview probe outcomes (label outcome=success|failure).");

    
    /// <summary>Failed <c>POST /v1/register</c> HTTP responses (labels: <c>reason</c>=validation|conflict|internal).</summary>
    public static readonly Counter<long> TrialRegistrationFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_registration_failures_total",
            description: "Self-service registration API failures (label reason=validation|conflict|internal).");

    
    /// <summary><c>TrialRunsUsed / TrialRunsLimit</c> at first manifest commit for metered trials (0.0–1.0+).</summary>
    public static readonly Histogram<double> TrialRunsUsedRatio =
        AppMeter.CreateHistogram(
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
    ///     Successful <c>POST /v1/register</c> where the prospect did not supply <c>baselineReviewCycleHours</c> (soft-default
    ///     / model path).
    /// </summary>
    public static readonly Counter<long> TrialSignupBaselineSkippedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signup_baseline_skipped_total",
            description: "Self-service trial signup completed without tenant-supplied baseline review-cycle hours.");

    
    /// <summary>Failed signup / trial bootstrap attempts (labels: <c>stage</c>, <c>reason</c>).</summary>
    public static readonly Counter<long> TrialSignupFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signup_failures_total",
            description: "Self-service trial funnel: failed signup or bootstrap attempts (labels: stage, reason).");

    
    /// <summary>Successful self-service trial activations (labels: <c>source</c>, <c>mode</c>).</summary>
    public static readonly Counter<long> TrialSignupsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signups_total",
            description: "Self-service trial funnel: successful trial activations (labels: source, mode).");

    
    /// <summary>Usage-based trial upgrade nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeClickedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_clicked_total",
            description: "Trial upgrade nudge CTA clicks (label: trigger=runs|seats|expiry).");

    
    /// <summary>Usage-based trial upgrade nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeShownTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_shown_total",
            description: "Trial upgrade nudge shown in operator shell (label: trigger=runs|seats|expiry).");

    
    /// <summary>
    ///     Wall-clock minutes from wizard run creation to first committed manifest (TB-220; labels
    ///     <c>execution_mode</c>, <c>preset_used</c>).
    /// </summary>
    public static readonly Histogram<double> WizardToCommittedMinutes =
        AppMeter.CreateHistogram<double>(
            "archlucid.pilot.wizard_to_committed_minutes",
            "min",
            "Wall-clock minutes from wizard submit to first committed manifest (labels execution_mode, preset_used).");

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
