namespace ArchLucid.Contracts.Governance;

/// <summary>
/// Read-only aggregate for the governance dashboard: pending approvals, recent decisions, and policy-pack change history for a tenant.
/// </summary>
public sealed class GovernanceDashboardSummary
{
    /// <summary>Pending approval requests (Draft or Submitted), newest first.</summary>
    public IReadOnlyList<GovernanceApprovalRequest> PendingApprovals { get; init; } = [];

    /// <summary>Recent terminal decisions (Approved, Rejected, Promoted), newest by review time first.</summary>
    public IReadOnlyList<GovernanceApprovalRequest> RecentDecisions { get; init; } = [];

    /// <summary>Recent policy pack change log entries for the tenant, newest first.</summary>
    public IReadOnlyList<PolicyPackChangeLogEntry> RecentChanges { get; init; } = [];

    /// <summary>Count of items in <see cref="PendingApprovals"/> (same cap as the list; not a separate total).</summary>
    public int PendingCount
    {
        get; init;
    }
}
