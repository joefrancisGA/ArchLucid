using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Application workflow facade for governance insights HTTP routes: dashboard, drift trend, lineage, and rationale.
/// </summary>
public interface IGovernanceInsightsFacade
{
    Task<GovernanceDashboardSummary> GetDashboardAsync(
        Guid tenantId,
        int maxPending,
        int maxDecisions,
        int maxChanges,
        CancellationToken ct);

    Task<IReadOnlyList<ComplianceDriftTrendPoint>> GetComplianceDriftTrendAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken ct);

    Task<GovernanceLineageResult?> GetApprovalRequestLineageAsync(
        string approvalRequestId,
        CancellationToken ct);

    Task<GovernanceRationaleResult?> GetApprovalRequestRationaleAsync(
        string approvalRequestId,
        CancellationToken ct);
}
