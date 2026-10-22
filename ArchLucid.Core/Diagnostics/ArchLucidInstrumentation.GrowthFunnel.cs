using System;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Thin forwarding partial preserving the public ArchLucidInstrumentation growth-funnel API.</summary>
public static partial class ArchLucidInstrumentation
{
    public static readonly Counter<long> BaselineManualPrepCapturedTotal = ArchLucidGrowthFunnelMeters.BaselineManualPrepCapturedTotal;

    public static readonly Counter<long> CorePilotRailChecklistStepsTotal = ArchLucidGrowthFunnelMeters.CorePilotRailChecklistStepsTotal;

    public static readonly Counter<long> EmailOtpChallengeRequestedTotal = ArchLucidGrowthFunnelMeters.EmailOtpChallengeRequestedTotal;

    public static readonly Counter<long> EmailOtpChallengeVerifiedTotal = ArchLucidGrowthFunnelMeters.EmailOtpChallengeVerifiedTotal;

    public static readonly Counter<long> EmailOtpDeliveryFailedTotal = ArchLucidGrowthFunnelMeters.EmailOtpDeliveryFailedTotal;

    public static readonly Counter<long> EmailOtpRateLimitTriggeredTotal = ArchLucidGrowthFunnelMeters.EmailOtpRateLimitTriggeredTotal;

    public static readonly Counter<long> FirstSessionCompletedTotal = ArchLucidGrowthFunnelMeters.FirstSessionCompletedTotal;

    public static readonly Counter<long> FirstTenantFunnelEventsTotal = ArchLucidGrowthFunnelMeters.FirstTenantFunnelEventsTotal;

    public static readonly Counter<long> OperatorTaskSuccessTotal = ArchLucidGrowthFunnelMeters.OperatorTaskSuccessTotal;

    public static readonly Histogram<double> PricingQuoteRequestAgeHours = ArchLucidGrowthFunnelMeters.PricingQuoteRequestAgeHours;

    public static readonly Counter<long> SelfServiceTrialAbuseDeniedTotal = ArchLucidGrowthFunnelMeters.SelfServiceTrialAbuseDeniedTotal;

    public static readonly Counter<long> SignupMarketingConversionTotal = ArchLucidGrowthFunnelMeters.SignupMarketingConversionTotal;

    public static readonly Counter<long> SponsorBannerFirstCommitBadgeRenderedTotal = ArchLucidGrowthFunnelMeters.SponsorBannerFirstCommitBadgeRenderedTotal;

    public static readonly Counter<long> TeamExpansionNudgeClickedTotal = ArchLucidGrowthFunnelMeters.TeamExpansionNudgeClickedTotal;

    public static readonly Counter<long> TeamExpansionNudgeShownTotal = ArchLucidGrowthFunnelMeters.TeamExpansionNudgeShownTotal;

    public static readonly Histogram<double> TenantTimeToFirstCommitSeconds = ArchLucidGrowthFunnelMeters.TenantTimeToFirstCommitSeconds;

    public static readonly Counter<long> TrialConversionTotal = ArchLucidGrowthFunnelMeters.TrialConversionTotal;

    public static readonly Counter<long> TrialExpirationsTotal = ArchLucidGrowthFunnelMeters.TrialExpirationsTotal;

    public static readonly Histogram<double> TrialFirstRunSeconds = ArchLucidGrowthFunnelMeters.TrialFirstRunSeconds;

    public static readonly Counter<long> TrialFunnelHealthProbeTotal = ArchLucidGrowthFunnelMeters.TrialFunnelHealthProbeTotal;

    public static readonly Counter<long> TrialRegistrationFailuresTotal = ArchLucidGrowthFunnelMeters.TrialRegistrationFailuresTotal;

    public static readonly Histogram<double> TrialRunsUsedRatio = ArchLucidGrowthFunnelMeters.TrialRunsUsedRatio;

    public static readonly Counter<long> TrialSignupBaselineSkippedTotal = ArchLucidGrowthFunnelMeters.TrialSignupBaselineSkippedTotal;

    public static readonly Counter<long> TrialSignupFailuresTotal = ArchLucidGrowthFunnelMeters.TrialSignupFailuresTotal;

    public static readonly Counter<long> TrialSignupsTotal = ArchLucidGrowthFunnelMeters.TrialSignupsTotal;

    public static readonly Counter<long> TrialUpgradeNudgeClickedTotal = ArchLucidGrowthFunnelMeters.TrialUpgradeNudgeClickedTotal;

    public static readonly Counter<long> TrialUpgradeNudgeShownTotal = ArchLucidGrowthFunnelMeters.TrialUpgradeNudgeShownTotal;

    public static readonly Histogram<double> WizardToCommittedMinutes = ArchLucidGrowthFunnelMeters.WizardToCommittedMinutes;

    public static void SetFirstTenantFunnelEventNameValidator(Func<string, bool> validator) =>
        ArchLucidGrowthFunnelMeters.SetFirstTenantFunnelEventNameValidator(validator);

    public static void EnsureTrialFunnelObservableGaugesRegistered() => ArchLucidGrowthFunnelMeters.EnsureTrialFunnelObservableGaugesRegistered();

    public static void PublishTrialActiveTenantCount(long count) => ArchLucidGrowthFunnelMeters.PublishTrialActiveTenantCount(count);

    public static void RecordTrialSignup(string source, string mode) => ArchLucidGrowthFunnelMeters.RecordTrialSignup(source, mode);

    public static void RecordSignupMarketingConversion(string coarseMedium, string coarsePlatform) => ArchLucidGrowthFunnelMeters.RecordSignupMarketingConversion(coarseMedium, coarsePlatform);

    public static void RecordTrialSignupFailure(string stage, string reason) => ArchLucidGrowthFunnelMeters.RecordTrialSignupFailure(stage, reason);

    public static void RecordTrialFunnelHealthProbe(string outcome) => ArchLucidGrowthFunnelMeters.RecordTrialFunnelHealthProbe(outcome);

    public static void RecordTrialRegistrationFailure(string reason) => ArchLucidGrowthFunnelMeters.RecordTrialRegistrationFailure(reason);

    public static void RecordEmailOtpChallengeRequested(string result) => ArchLucidGrowthFunnelMeters.RecordEmailOtpChallengeRequested(result);

    public static void RecordEmailOtpChallengeVerified(string result) => ArchLucidGrowthFunnelMeters.RecordEmailOtpChallengeVerified(result);

    public static void RecordEmailOtpDeliveryFailed() => ArchLucidGrowthFunnelMeters.RecordEmailOtpDeliveryFailed();

    public static void RecordEmailOtpRateLimitTriggered(string scope) => ArchLucidGrowthFunnelMeters.RecordEmailOtpRateLimitTriggered(scope);

    public static void RecordSelfServiceTrialAbuseDenied(string reason) => ArchLucidGrowthFunnelMeters.RecordSelfServiceTrialAbuseDenied(reason);

    public static void RecordTrialSignupBaselineSkipped() => ArchLucidGrowthFunnelMeters.RecordTrialSignupBaselineSkipped();

    public static void RecordBaselineManualPrepCaptured() => ArchLucidGrowthFunnelMeters.RecordBaselineManualPrepCaptured();

    public static void RecordTrialFirstRunLatencySeconds(double seconds) => ArchLucidGrowthFunnelMeters.RecordTrialFirstRunLatencySeconds(seconds);

    public static void RecordTenantTimeToFirstCommitSeconds(double seconds, string tenantKind) => ArchLucidGrowthFunnelMeters.RecordTenantTimeToFirstCommitSeconds(seconds, tenantKind);

    public static void RecordTrialRunsUsedRatio(double ratio) => ArchLucidGrowthFunnelMeters.RecordTrialRunsUsedRatio(ratio);

    public static void RecordTrialConversion(string fromState, string toTier) => ArchLucidGrowthFunnelMeters.RecordTrialConversion(fromState, toTier);

    public static void RecordTrialExpiration(string reason) => ArchLucidGrowthFunnelMeters.RecordTrialExpiration(reason);

    public static void RecordTrialUpgradeNudgeShown(string trigger) => ArchLucidGrowthFunnelMeters.RecordTrialUpgradeNudgeShown(trigger);

    public static void RecordTrialUpgradeNudgeClicked(string trigger) => ArchLucidGrowthFunnelMeters.RecordTrialUpgradeNudgeClicked(trigger);

    public static void RecordTeamExpansionNudgeShown(string trigger) => ArchLucidGrowthFunnelMeters.RecordTeamExpansionNudgeShown(trigger);

    public static void RecordTeamExpansionNudgeClicked(string trigger) => ArchLucidGrowthFunnelMeters.RecordTeamExpansionNudgeClicked(trigger);

    public static void RecordSponsorBannerFirstCommitBadgeRendered(Guid tenantId, string daysSinceFirstCommitBucket) => ArchLucidGrowthFunnelMeters.RecordSponsorBannerFirstCommitBadgeRendered(tenantId, daysSinceFirstCommitBucket);

    public static void RecordCorePilotRailChecklistStep(int stepIndex) => ArchLucidGrowthFunnelMeters.RecordCorePilotRailChecklistStep(stepIndex);

    public static void RecordFirstSessionCompleted() => ArchLucidGrowthFunnelMeters.RecordFirstSessionCompleted();

    public static void RecordWizardToCommittedMinutes(double minutes, string executionMode, string presetUsed) => ArchLucidGrowthFunnelMeters.RecordWizardToCommittedMinutes(minutes, executionMode, presetUsed);

    public static void RecordPricingQuoteRequestAgeHours(double ageHours, string breachStatus) => ArchLucidGrowthFunnelMeters.RecordPricingQuoteRequestAgeHours(ageHours, breachStatus);

    public static void RecordFirstTenantFunnelEvent(
        string eventName,
        bool recordPerTenant,
        string? tenantIdNormalized) => ArchLucidGrowthFunnelMeters.RecordFirstTenantFunnelEvent(eventName, recordPerTenant, tenantIdNormalized);

    public static void RecordOperatorTaskSuccess(string task) => ArchLucidGrowthFunnelMeters.RecordOperatorTaskSuccess(task);

}