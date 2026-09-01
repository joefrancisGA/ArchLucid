namespace ArchLucid.Persistence.Tenancy.Diagnostics;

/// <summary>Aggregates trial funnel audit events into a founder-facing summary (Batch B item 20).</summary>
internal static partial class TrialFunnelOperationalSummaryBuilder
{
    internal const string StageTrialStarted = "trial-started";
    internal const string StageFirstReviewFinalized = "first-review-finalized";
    internal const string StageCheckoutActivity = "checkout-activity";
    internal const string StageConverted = "converted";

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
