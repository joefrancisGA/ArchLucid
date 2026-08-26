namespace ArchLucid.Host.Core.Jobs;

/// <summary>Canonical job slugs shared by configuration, Terraform, and CLI.</summary>
public static class ArchLucidJobNames
{
    public const string AdvisoryScan = "advisory-scan";

    public const string OrphanProbe = "orphan-probe";

    /// <summary>Required audit trail domain↔audit orphan detection (TB-955 / INV-003).</summary>
    public const string RequiredAuditTrailOrphanProbe = "required-audit-trail-orphan-probe";

    public const string DataArchival = "data-archival";

    public const string FirstTenantFunnelArchival = "first-tenant-funnel-archival";

    public const string TrialLifecycle = "trial-lifecycle";

    public const string TrialEmailScan = "trial-email-scan";

    public const string ExecDigestWeekly = "exec-digest-weekly";

    public const string SponsorDigestWeekly = "sponsor-digest-weekly";

    public const string WeeklySponsorReport = "weekly-sponsor-report";

    /// <summary>Weekly sponsor summary email dispatch (offload slug <c>weekly-sponsor-summary</c>).</summary>
    public const string WeeklySponsorSummary = "weekly-sponsor-summary";

    /// <summary>Legacy name retained for job registration tests.</summary>
    public const string WeeklyExecutiveSummary = WeeklySponsorSummary;

    /// <summary>Mock weekly relational critical-findings digest (log-only scaffold).</summary>
    public const string WeeklyArchitectureDigest = "weekly-architecture-digest";

    public const string AuditChangeFeed = "audit-change-feed";

    public const string ServiceBusIntegrationEvents = "servicebus-integration-events";

    /// <summary>
    /// In-process only today: <see cref="ArchLucid.Core.Audit.InMemoryAuditRetryQueue"/> is not shared across containers.
    /// Defer Container Apps offload until a durable queue exists (ADR 0018).
    /// </summary>
    public const string AuditRetryDrain = "audit-retry-drain";
}
