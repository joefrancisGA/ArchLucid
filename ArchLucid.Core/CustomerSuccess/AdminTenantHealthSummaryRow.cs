namespace ArchLucid.Core.CustomerSuccess;

/// <summary>Cross-tenant health row for internal admin surfaces (TB-228).</summary>
public sealed record AdminTenantHealthSummaryRow(
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    decimal EngagementScore,
    decimal GovernanceScore,
    int RunsLast7d,
    int CommitsLast7d,
    int TotalRuns,
    int CommittedRuns,
    int ComparisonEventsLast30Days,
    DateTimeOffset? LastActivityUtc);
